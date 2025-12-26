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
      console.log('=== CREATE ROOM START ===');
      console.log('Parameters:', { hostId, hostNickname, moviesCount: movies.length });
      console.log('Timestamp:', new Date().toISOString());
      
      // Verifica che le tabelle esistano prima di procedere
      console.log('Checking if rooms table exists...');
      try {
        const { error: testError } = await supabase
          .from('rooms')
          .select('id')
          .limit(1);
        
        if (testError) {
          if (testError.code === '42P01' || testError.message?.includes('does not exist')) {
            throw new Error('La tabella "rooms" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
          }
          console.warn('Warning checking rooms table:', testError);
        } else {
          console.log('✓ Rooms table exists');
        }
      } catch (tableCheckError) {
        console.error('Table check failed:', tableCheckError);
        throw tableCheckError;
      }
      
      // Genera codice univoco
      console.log('Generating unique room code...');
      let code = this.generateCode();
      let attempts = 0;
      
      // Verifica che il codice sia unico (max 10 tentativi)
      while (attempts < 10) {
        try {
          const { data: existing, error: checkError } = await supabase
            .from('rooms')
            .select('code')
            .eq('code', code)
            .maybeSingle();
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking code uniqueness:', checkError);
            throw checkError;
          }
          
          if (!existing) {
            console.log(`✓ Code ${code} is available (attempt ${attempts + 1})`);
            break; // Codice disponibile
          }
          
          console.log(`✗ Code ${code} already exists, generating new one...`);
          code = this.generateCode();
          attempts++;
        } catch (error) {
          console.error('Error in code check loop:', error);
          throw error;
        }
      }
      
      if (attempts >= 10) {
        console.error('Failed to generate unique room code after 10 attempts');
        throw new Error('Impossibile generare un codice stanza univoco. Riprova.');
      }

      console.log('✓ Generated unique code:', code);

      // Crea stanza nel database
      console.log('Inserting room into database...');
      console.log('Room data to insert:', {
        code,
        host_id: hostId,
        host_nickname: hostNickname,
        movies_count: movies.length,
        status: 'lobby'
      });
      
      const insertStartTime = Date.now();
      let roomData: any = null;
      
      try {
        const { data, error: roomError } = await supabase
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
        
        const insertTime = Date.now() - insertStartTime;
        console.log(`Room insert completed in ${insertTime}ms`);

        if (roomError) {
          console.error('=== ROOM INSERT ERROR ===');
          console.error('Error code:', roomError.code);
          console.error('Error message:', roomError.message);
          console.error('Error details:', roomError.details);
          console.error('Error hint:', roomError.hint);
          
          // Se la tabella non esiste, fornisci un messaggio più chiaro
          if (roomError.code === '42P01' || roomError.message?.includes('does not exist')) {
            throw new Error('La tabella "rooms" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
          }
          
          // Se è un errore di RLS policy
          if (roomError.code === '42501' || roomError.message?.includes('permission denied') || roomError.message?.includes('policy')) {
            throw new Error('Errore di permessi: verifica che le RLS policies per la tabella "rooms" siano configurate correttamente. Vedi supabase-rooms-schema.sql');
          }
          
          throw new Error(`Errore nella creazione della stanza: ${roomError.message} (codice: ${roomError.code})`);
        }

        if (!data) {
          throw new Error('La stanza è stata creata ma non è stato possibile recuperare i dati. Riprova.');
        }

        roomData = data;
        console.log('✓ Room created in database:', roomData.id);
        
      } catch (insertError: any) {
        const insertTime = Date.now() - insertStartTime;
        console.error(`Room insert failed after ${insertTime}ms`);
        console.error('=== ROOM INSERT ERROR ===');
        console.error('Error:', insertError);
        
        // Se è un errore di rete
        if (insertError?.message?.includes('Failed to fetch') || 
            insertError?.message?.includes('NetworkError') ||
            insertError?.message?.includes('Network request failed') ||
            insertError?.name === 'TypeError' ||
            (insertError?.message && typeof insertError.message === 'string' && insertError.message.includes('fetch'))) {
          throw new Error('Errore di connessione a Supabase. Verifica la connessione internet e riprova.');
        }
        
        // Rilancia altri errori (già gestiti sopra)
        throw insertError;
      }

      // Aggiungi host come membro
      console.log('Adding host as member...');
      const memberStartTime = Date.now();
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomData.id,
          user_id: hostId,
          nickname: hostNickname,
          is_host: true,
          status: 'ready'
        });
      
      const memberTime = Date.now() - memberStartTime;
      console.log(`Member insert completed in ${memberTime}ms`);

      if (memberError) {
        console.error('=== MEMBER INSERT ERROR ===');
        console.error('Error code:', memberError.code);
        console.error('Error message:', memberError.message);
        console.error('Error details:', memberError.details);
        
        // Elimina la stanza se non riusciamo ad aggiungere l'host
        console.log('Cleaning up: deleting room due to member insert failure...');
        await supabase.from('rooms').delete().eq('id', roomData.id);
        
        // Se la tabella non esiste, fornisci un messaggio più chiaro
        if (memberError.code === '42P01' || memberError.message?.includes('does not exist')) {
          throw new Error('La tabella "room_members" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
        }
        
        // Se è un errore di RLS policy
        if (memberError.code === '42501' || memberError.message?.includes('permission denied') || memberError.message?.includes('policy')) {
          throw new Error('Errore di permessi: verifica che le RLS policies per la tabella "room_members" siano configurate correttamente. Vedi supabase-rooms-schema.sql');
        }
        
        throw new Error(`Errore nell'aggiunta dell'host come membro: ${memberError.message} (codice: ${memberError.code})`);
      }

      console.log('✓ Host added as member successfully');

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

      console.log('=== CREATE ROOM SUCCESS ===');
      console.log('Room object created:', room.code);
      console.log('Room summary:', {
        id: room.id,
        code: room.code,
        membersCount: room.members.length,
        moviesCount: room.movies.length
      });
      
      return room;
    } catch (error) {
      console.error('=== CREATE ROOM ERROR ===');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Rilancia l'errore con messaggio più chiaro
      throw error;
    }
  }

  async getRoom(code: string): Promise<Room | null> {
    try {
      console.log('getRoom called with code:', code);
      
      // Carica stanza dal database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        console.error('Error details:', {
          code: roomError.code,
          message: roomError.message,
          details: roomError.details,
          hint: roomError.hint
        });
        
        // Se la tabella non esiste, fornisci un messaggio più chiaro
        if (roomError.code === '42P01' || roomError.message?.includes('does not exist')) {
          throw new Error('La tabella "rooms" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
        }
        
        // Se la stanza non esiste (PGRST116), è normale
        if (roomError.code === 'PGRST116') {
          console.log('Room not found (code does not exist)');
          return null;
        }
        
        return null;
      }

      if (!roomData) {
        console.log('Room data is null');
        return null;
      }

      console.log('Room data loaded:', roomData.id);

      // Carica membri
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomData.id);

      if (membersError) {
        console.error('Error fetching room members:', membersError);
        console.error('Error details:', {
          code: membersError.code,
          message: membersError.message
        });
        // Non ritornare null se c'è un errore nel caricare i membri, usa array vuoto
        console.warn('Continuing with empty members array');
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

      console.log('Room object built, members count:', room.members.length);
      return room;
    } catch (error) {
      console.error('Error in getRoom:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        // Rilancia l'errore se è un errore di tabella mancante
        if (error.message.includes('non esiste')) {
          throw error;
        }
      }
      return null;
    }
  }

  async joinRoom(code: string, userId: string, nickname: string): Promise<Room | null> {
    try {
      console.log('joinRoom called:', { code, userId, nickname });
      
      // Carica stanza
      console.log('Loading room...');
      const room = await this.getRoom(code);
      if (!room) {
        console.error('Room not found for code:', code);
        return null;
      }
      console.log('Room loaded:', room.id);

      // Verifica se l'utente è già membro
      const existingMember = room.members.find(m => m.id === userId);
      if (existingMember) {
        console.log('User already a member of this room');
        return room; // Già membro
      }

      // Aggiungi nuovo membro
      console.log('Adding user as member...');
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: userId,
          nickname,
          is_host: false,
          status: 'ready'
        })
        .select()
        .single();

      if (memberError) {
        console.error('Error joining room:', memberError);
        console.error('Error details:', {
          code: memberError.code,
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint
        });
        
        // Se la tabella non esiste, fornisci un messaggio più chiaro
        if (memberError.code === '42P01' || memberError.message?.includes('does not exist')) {
          throw new Error('La tabella "room_members" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
        }
        
        // Se è un errore di constraint (utente già membro), ricarica la stanza
        if (memberError.code === '23505') {
          console.log('User already member (constraint violation), reloading room...');
          return await this.getRoom(code);
        }
        
        return null;
      }

      console.log('User added as member successfully:', memberData.id);

      // Ricarica stanza con nuovo membro
      console.log('Reloading room with new member...');
      const updatedRoom = await this.getRoom(code);
      if (!updatedRoom) {
        console.error('Failed to reload room after joining');
        return null;
      }
      
      console.log('Room reloaded successfully, members count:', updatedRoom.members.length);
      return updatedRoom;
    } catch (error) {
      console.error('Error in joinRoom:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        // Rilancia l'errore con messaggio più chiaro
        throw error;
      }
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
