// Sistema di stanze multiplayer con Supabase
import { Movie } from '../types';
import { supabase } from './supabaseClient';

export interface RoomMember {
  id: string;
  nickname: string;
  isHost: boolean;
  status: 'ready' | 'playing' | 'lobby';
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
      
      // Verifica che le tabelle esistano prima di procedere - OTTIMIZZATO con timeout
      console.log('Checking if rooms table exists...');
      try {
        const tableCheckPromise = supabase
          .from('rooms')
          .select('id')
          .limit(1);
        
        // Timeout di 1 secondo per controllo tabella
        const tableCheckTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Table check timeout')), 1000);
        });
        
        const { error: testError } = await Promise.race([tableCheckPromise, tableCheckTimeout]) as any;
        
        if (testError) {
          if (testError.code === '42P01' || testError.message?.includes('does not exist')) {
            throw new Error('La tabella "rooms" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
          }
          if (testError.message !== 'Table check timeout') {
            console.warn('Warning checking rooms table:', testError);
          }
        } else {
          console.log('✓ Rooms table exists');
        }
      } catch (tableCheckError: any) {
        if (tableCheckError?.message === 'Table check timeout') {
          console.warn('Table check timeout - assuming table exists and continuing...');
        } else {
          console.error('Table check failed:', tableCheckError);
          throw tableCheckError;
        }
      }
      
      // Genera codice univoco - OTTIMIZZATO
      console.log('Generating unique room code...');
      let code = this.generateCode();
      let attempts = 0;
      const maxAttempts = 3; // Ridotto da 10 a 3 per velocità
      
      // Timeout totale per controllo codice (massimo 1.5 secondi)
      const codeCheckStartTime = Date.now();
      const maxCodeCheckTime = 1500;
      
      // Verifica che il codice sia unico (max 3 tentativi con timeout)
      while (attempts < maxAttempts) {
        // Controlla timeout totale
        if (Date.now() - codeCheckStartTime > maxCodeCheckTime) {
          console.warn('Code check timeout - using generated code (likely unique)');
          break;
        }
        
        try {
          const checkPromise = supabase
            .from('rooms')
            .select('code')
            .eq('code', code)
            .maybeSingle();
          
          // Timeout di 500ms per ogni controllo
          const checkTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Code check timeout')), 500);
          });
          
          const { data: existing, error: checkError } = await Promise.race([
            checkPromise,
            checkTimeout
          ]) as any;
          
          if (checkError && checkError.message !== 'Code check timeout' && checkError.code !== 'PGRST116') {
            console.error('Error checking code uniqueness:', checkError);
            // Continua comunque - probabilmente il codice è unico
            break;
          }
          
          if (!existing) {
            console.log(`✓ Code ${code} is available (attempt ${attempts + 1})`);
            break; // Codice disponibile
          }
          
          console.log(`✗ Code ${code} already exists, generating new one...`);
          code = this.generateCode();
          attempts++;
        } catch (error: any) {
          if (error?.message === 'Code check timeout') {
            console.warn('Code check timeout - using code anyway (likely unique)');
            break; // Usa il codice generato
          }
          console.error('Error in code check loop:', error);
          // Continua comunque
          break;
        }
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

      // Aggiungi host come membro - con timeout
      console.log('Adding host as member...');
      const memberStartTime = Date.now();
      
      try {
        const memberPromise = supabase
          .from('room_members')
          .insert({
            room_id: roomData.id,
            user_id: hostId,
            nickname: hostNickname,
            is_host: true,
            status: 'lobby'
          });
        
        // Timeout di 2 secondi per inserimento membro
        const memberTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Member insert timeout')), 2000);
        });
        
        const { error: memberError } = await Promise.race([memberPromise, memberTimeout]) as any;
        
        const memberTime = Date.now() - memberStartTime;
        console.log(`Member insert completed in ${memberTime}ms`);
        
        if (memberError && memberError.message !== 'Member insert timeout') {
          console.error('=== MEMBER INSERT ERROR ===');
          console.error('Error code:', memberError.code);
          console.error('Error message:', memberError.message);
          
          // Se è un errore di constraint (utente già membro), non è critico
          if (memberError.code === '23505') {
            console.warn('User already member (constraint violation) - non-critical, continuing...');
          } else {
            throw memberError;
          }
        }
      } catch (memberError: any) {
        if (memberError?.message === 'Member insert timeout') {
          console.warn('Member insert timeout - non-critical, continuing...');
        } else {
          // Gestisci altri errori
          console.error('=== MEMBER INSERT ERROR ===');
          console.error('Error:', memberError);
          
          if (memberError?.code) {
            console.error('Error code:', memberError.code);
            console.error('Error message:', memberError.message);
            console.error('Error details:', memberError.details);
            console.error('Error hint:', memberError.hint);
            
            // Se la tabella non esiste, fornisci un messaggio più chiaro
            if (memberError.code === '42P01' || memberError.message?.includes('does not exist')) {
              throw new Error('La tabella "room_members" non esiste. Esegui lo schema SQL in Supabase Dashboard → SQL Editor. Vedi il file supabase-rooms-schema.sql');
            }
            
            // Se è un errore di RLS policy
            if (memberError.code === '42501' || memberError.message?.includes('permission denied') || memberError.message?.includes('policy')) {
              throw new Error('Errore di permessi: verifica che le RLS policies per la tabella "room_members" siano configurate correttamente. Vedi supabase-rooms-schema.sql');
            }
            
            // Se è un errore di constraint (utente già membro), non è critico
            if (memberError.code === '23505') {
              console.warn('User already member (constraint violation) - non-critical, continuing...');
            } else {
              throw new Error(`Errore nell'aggiunta dell'host come membro: ${memberError.message} (codice: ${memberError.code})`);
            }
          } else {
            // Se non ha codice, rilancia
            throw memberError;
          }
        }
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
          status: 'lobby'
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
          status: (m.status || 'lobby') as 'ready' | 'playing' | 'lobby'
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
          status: 'lobby' // Imposta inizialmente a 'lobby' (non pronto)
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

  async cancelRoom(code: string): Promise<boolean> {
    try {
      const room = await this.getRoom(code);
      if (!room) return false;

      console.log('[cancelRoom] Cancelling room:', code);
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'lobby', updated_at: new Date().toISOString() })
        .eq('code', code);

      if (error) {
        console.error('[cancelRoom] Error:', error);
        return false;
      }

      // Reset tutti i membri a 'lobby' (non pronti)
      const { error: membersError } = await supabase
        .from('room_members')
        .update({ status: 'lobby' })
        .eq('room_id', room.id);

      if (membersError) {
        console.error('[cancelRoom] Error updating members:', membersError);
        // Non critico, continua
      }

      return true;
    } catch (error) {
      console.error('[cancelRoom] Exception:', error);
      return false;
    }
  }

  async startRoom(code: string): Promise<boolean> {
    try {
      const room = await this.getRoom(code);
      if (!room) {
        console.error('[startRoom] Room not found:', code);
        return false;
      }

      console.log('[startRoom] Updating room status to playing:', code);
      const { data, error } = await supabase
        .from('rooms')
        .update({ status: 'playing', updated_at: new Date().toISOString() })
        .eq('code', code)
        .select();

      if (error) {
        console.error('[startRoom] Error updating room:', error);
        return false;
      }

      console.log('[startRoom] Room status updated successfully:', data);
      return true;
    } catch (error) {
      console.error('[startRoom] Exception:', error);
      return false;
    }
  }

  async updateMemberStatus(code: string, userId: string, status: 'ready' | 'playing' | 'lobby'): Promise<boolean> {
    try {
      console.log('[updateMemberStatus] Called with:', { code, userId, status });
      const room = await this.getRoom(code);
      if (!room) {
        console.error('[updateMemberStatus] Room not found:', code);
        return false;
      }

      console.log('[updateMemberStatus] Updating member status in room:', room.id);
      const { error, data } = await supabase
        .from('room_members')
        .update({ status })
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('[updateMemberStatus] Error updating member status:', error);
        console.error('[updateMemberStatus] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      console.log('[updateMemberStatus] Success! Updated rows:', data?.length || 0);
      return true;
    } catch (error) {
      console.error('[updateMemberStatus] Exception:', error);
      return false;
    }
  }

  async updateRoomMovies(code: string, movies: Movie[]): Promise<boolean> {
    try {
      console.log(`[Background] Updating room ${code} with ${movies.length} movies from TMDB...`);
      const { error } = await supabase
        .from('rooms')
        .update({ movies: movies as any })
        .eq('code', code.toUpperCase());
      
      if (error) {
        console.error('[Background] Error updating room movies:', error);
        return false;
      }
      
      console.log(`[Background] ✓ Room ${code} updated with TMDB movies`);
      return true;
    } catch (error) {
      console.error('[Background] Exception updating room movies:', error);
      return false;
    }
  }

  // Sottoscrizione real-time per aggiornamenti stanza
  subscribeToRoom(code: string, callback: (room: Room | null) => void) {
    let roomId: string | null = null;
    let unsubscribe: (() => void) | null = null;
    let roomChannel: ReturnType<typeof supabase.channel> | null = null;
    
    // Prima carica la stanza per ottenere l'ID
    this.getRoom(code).then(room => {
      if (room) {
        roomId = room.id;
        console.log(`[RoomService] Subscribing to room ${code} (id: ${roomId})`);
        callback(room);
        
        // Crea il channel con roomId già disponibile
        roomChannel = supabase
          .channel(`room:${code}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'rooms',
              filter: `code=eq.${code}`
            },
            (payload) => {
              console.log(`[RoomService] Room ${code} changed:`, payload.eventType);
              // Ricarica stanza quando cambia
              this.getRoom(code).then(updatedRoom => {
                if (updatedRoom) {
                  console.log(`[RoomService] Room ${code} reloaded, members:`, updatedRoom.members.length, updatedRoom.members.map(m => ({ id: m.id, nickname: m.nickname, status: m.status })));
                  callback(updatedRoom);
                }
              });
            }
          )
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_members',
              filter: `room_id=eq.${roomId}` // roomId è già disponibile qui
            },
            (payload) => {
              console.log(`[RoomService] Room ${code} members changed:`, payload.eventType, payload);
              // Piccolo delay per assicurarsi che il DB sia aggiornato
              setTimeout(() => {
                // Ricarica stanza quando cambiano i membri
                this.getRoom(code).then(updatedRoom => {
                  if (updatedRoom) {
                    console.log(`[RoomService] Room ${code} members reloaded after change:`, updatedRoom.members.length, updatedRoom.members.map(m => ({ id: m.id, nickname: m.nickname, status: m.status })));
                    callback(updatedRoom);
                  } else {
                    console.error(`[RoomService] Failed to reload room ${code} after member change`);
                  }
                });
              }, 100);
            }
          )
          .subscribe((status) => {
            console.log(`[RoomService] Subscription status for room ${code}:`, status);
          });

        // Salva funzione di cleanup
        unsubscribe = () => {
          console.log(`[RoomService] Unsubscribing from room ${code}`);
          if (roomChannel) {
            supabase.removeChannel(roomChannel);
          }
        };
      } else {
        console.error(`[RoomService] Cannot subscribe to room ${code}: room not found`);
      }
    });

    // Ritorna funzione di cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }
}

export const roomService = new RoomService();
