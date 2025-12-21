// Sistema di stanze multiplayer con Supabase
import { Movie } from '../types';
import { supabase } from './supabaseClient';

export interface RoomMember {
  id: string;
  nickname: string;
  isHost: boolean;
  status: 'ready' | 'playing';
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  hostNickname: string;
  movies: Movie[];
  members: RoomMember[];
  status: 'lobby' | 'playing' | 'finished';
  createdAt: number;
}

class RoomService {
  // Genera codice stanza univoco
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createRoom(hostId: string, hostNickname: string, movies: Movie[]): Promise<Room | null> {
    try {
      // Genera codice univoco
      let code = this.generateCode();
      let attempts = 0;
      
      // Verifica che il codice sia unico (max 10 tentativi)
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('rooms')
          .select('code')
          .eq('code', code)
          .single();
        
        if (!existing) break; // Codice disponibile
        code = this.generateCode();
        attempts++;
      }
      
      if (attempts >= 10) {
        console.error('Failed to generate unique room code');
        return null;
      }

      // Crea stanza nel database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code,
          host_id: hostId,
          host_nickname: hostNickname,
          movies: movies as any,
          status: 'lobby'
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        return null;
      }

      // Aggiungi host come membro
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomData.id,
          user_id: hostId,
          nickname: hostNickname,
          is_host: true,
          status: 'ready'
        });

      if (memberError) {
        console.error('Error adding host to room:', memberError);
        // Elimina la stanza se non riusciamo ad aggiungere l'host
        await supabase.from('rooms').delete().eq('id', roomData.id);
        return null;
      }

      // Costruisci oggetto Room
      const room: Room = {
        id: roomData.id,
        code: roomData.code,
        hostId: roomData.host_id,
        hostNickname: roomData.host_nickname,
        movies: roomData.movies as Movie[],
        members: [{
          id: hostId,
          nickname: hostNickname,
          isHost: true,
          status: 'ready'
        }],
        status: roomData.status as 'lobby' | 'playing' | 'finished',
        createdAt: new Date(roomData.created_at).getTime()
      };

      return room;
    } catch (error) {
      console.error('Error in createRoom:', error);
      return null;
    }
  }

  async getRoom(code: string): Promise<Room | null> {
    try {
      // Carica stanza dal database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (roomError || !roomData) {
        console.error('Error fetching room:', roomError);
        return null;
      }

      // Carica membri
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomData.id);

      if (membersError) {
        console.error('Error fetching room members:', membersError);
        return null;
      }

      // Costruisci oggetto Room
      const room: Room = {
        id: roomData.id,
        code: roomData.code,
        hostId: roomData.host_id,
        hostNickname: roomData.host_nickname,
        movies: roomData.movies as Movie[],
        members: (membersData || []).map(m => ({
          id: m.user_id,
          nickname: m.nickname,
          isHost: m.is_host,
          status: m.status as 'ready' | 'playing'
        })),
        status: roomData.status as 'lobby' | 'playing' | 'finished',
        createdAt: new Date(roomData.created_at).getTime()
      };

      return room;
    } catch (error) {
      console.error('Error in getRoom:', error);
      return null;
    }
  }

  async joinRoom(code: string, userId: string, nickname: string): Promise<Room | null> {
    try {
      // Carica stanza
      const room = await this.getRoom(code);
      if (!room) {
        console.error('Room not found');
        return null;
      }

      // Verifica se l'utente è già membro
      if (room.members.find(m => m.id === userId)) {
        return room; // Già membro
      }

      // Aggiungi nuovo membro
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: userId,
          nickname,
          is_host: false,
          status: 'ready'
        });

      if (memberError) {
        console.error('Error joining room:', memberError);
        return null;
      }

      // Ricarica stanza con nuovo membro
      return await this.getRoom(code);
    } catch (error) {
      console.error('Error in joinRoom:', error);
      return null;
    }
  }

  async startRoom(code: string): Promise<boolean> {
    try {
      const room = await this.getRoom(code);
      if (!room) return false;

      const { error } = await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('code', code);

      if (error) {
        console.error('Error starting room:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in startRoom:', error);
      return false;
    }
  }

  async updateMemberStatus(code: string, userId: string, status: 'ready' | 'playing'): Promise<boolean> {
    try {
      const room = await this.getRoom(code);
      if (!room) return false;

      const { error } = await supabase
        .from('room_members')
        .update({ status })
        .eq('room_id', room.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating member status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMemberStatus:', error);
      return false;
    }
  }

  // Sottoscrizione real-time per aggiornamenti stanza
  subscribeToRoom(code: string, callback: (room: Room | null) => void) {
    let roomId: string | null = null;
    
    // Prima carica la stanza per ottenere l'ID
    this.getRoom(code).then(room => {
      if (room) {
        roomId = room.id;
        callback(room);
        
        // Poi sottoscrivi agli aggiornamenti
        const roomChannel = supabase
          .channel(`room:${code}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'rooms',
              filter: `code=eq.${code}`
            },
            () => {
              // Ricarica stanza quando cambia
              this.getRoom(code).then(callback);
            }
          )
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_members',
              filter: `room_id=eq.${roomId}`
            },
            () => {
              // Ricarica stanza quando cambiano i membri
              this.getRoom(code).then(callback);
            }
          )
          .subscribe();

        // Ritorna funzione di cleanup
        return () => {
          supabase.removeChannel(roomChannel);
        };
      }
    });

    // Ritorna funzione di cleanup vuota se la stanza non esiste ancora
    return () => {};
  }
}

export const roomService = new RoomService();
