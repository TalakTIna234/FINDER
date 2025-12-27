
import React, { useState, useEffect } from 'react';
import { HapticButton } from '../components/HapticButton';
import { ChevronLeft, Share, Play, Users, Search, List, Wand2, Sparkles, Check, X, Copy, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GENRES, DEFAULT_MOVIES_BY_GENRE } from '../constants';
import { Movie } from '../types';
import { movieService } from '../services/movieService';
import { roomService, Room } from '../services/roomService';
import { authService } from '../services/authService';
import { statsService } from '../services/statsService';
import { useState as useRoomState, useEffect as useRoomEffect } from 'react';
import { useToast } from '../components/Toast';

// Funzione per generare UUID v4 valido
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback per browser che non supportano crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface Props {
  onBack: () => void;
  onStartSession: (movies: Movie[], roomCode?: string, roomId?: string, membersCount?: number) => void;
  mode: 'create' | 'join';
}

export const RoomView: React.FC<Props> = ({ onBack, onStartSession, mode }) => {
  const [step, setStep] = useState<'type' | 'genre' | 'manual' | 'lobby' | 'code'>(mode === 'create' ? 'type' : 'code');
  const [roomCode, setRoomCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();
  
  // Stati per modalità manuale
  const [manualMovies, setManualMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Carica user ID (sia autenticato che guest)
    const loadUserId = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        console.log('[RoomView] Setting currentUserId from authenticated user:', user.id);
        setCurrentUserId(user.id);
      } else {
        // Se non autenticato, usa guest ID
        const guestId = localStorage.getItem('mm_guest_id');
        if (guestId) {
          console.log('[RoomView] Setting currentUserId from guest ID:', guestId);
          setCurrentUserId(guestId);
        } else {
          // Genera guest ID se non esiste
          const newGuestId = generateUUID();
          localStorage.setItem('mm_guest_id', newGuestId);
          console.log('[RoomView] Generated new guest ID:', newGuestId);
          setCurrentUserId(newGuestId);
        }
      }
    };
    
    loadUserId();
    
    if (roomCode && step === 'lobby') {
      // Assicurati che currentUserId sia caricato anche quando si entra in lobby
      const ensureUserId = async () => {
        if (!currentUserId) {
          const user = await authService.getCurrentUser();
          if (user) {
            console.log('[RoomView Lobby] Setting currentUserId from authenticated user:', user.id);
            setCurrentUserId(user.id);
          } else {
            const guestId = localStorage.getItem('mm_guest_id');
            if (guestId) {
              console.log('[RoomView Lobby] Setting currentUserId from guest ID:', guestId);
              setCurrentUserId(guestId);
            }
          }
        }
      };
      ensureUserId();
      
      // Carica stanza dal database
      roomService.getRoom(roomCode).then(currentRoom => {
        if (currentRoom) {
          setRoom(currentRoom);
          // Se la stanza è già in playing, avvia la sessione
          if (currentRoom.status === 'playing') {
            if (currentRoom.movies && currentRoom.movies.length > 0) {
              console.log('[RoomView] Room is already playing - starting session automatically with', currentRoom.movies.length, 'movies');
              onStartSession(currentRoom.movies, roomCode, currentRoom.id, currentRoom.members.length);
            } else {
              console.error('[RoomView] Room is already playing but no movies available');
            }
          }
        }
      });

      // Sottoscrivi agli aggiornamenti real-time
      let unsubscribe: (() => void) | null = null;
      
      // Carica stanza inizialmente e poi sottoscrivi - FORZA ricaricamento
      const setupSubscription = async () => {
        try {
          const initialRoom = await roomService.getRoom(roomCode);
          if (initialRoom) {
            console.log('[RoomView] Initial room loaded:', {
              code: initialRoom.code,
              membersCount: initialRoom.members.length,
              members: initialRoom.members.map(m => ({ id: m.id, nickname: m.nickname, status: m.status }))
            });
            setRoom(initialRoom);
            
            console.log('[RoomView] Setting up subscription for room:', roomCode);
            unsubscribe = roomService.subscribeToRoom(roomCode, (updatedRoom) => {
            if (updatedRoom) {
              console.log('[RoomView] Room updated via subscription:', {
                code: updatedRoom.code,
                status: updatedRoom.status,
                membersCount: updatedRoom.members.length,
                moviesCount: updatedRoom.movies?.length || 0,
                members: updatedRoom.members.map(m => ({ id: m.id, nickname: m.nickname, status: m.status }))
              });
              
              // Aggiorna sempre la stanza (per vedere nuovi membri)
              setRoom(prevRoom => {
                // Log del cambio per debug
                if (prevRoom && prevRoom.members.length !== updatedRoom.members.length) {
                  console.log('[RoomView] Member count changed:', prevRoom.members.length, '->', updatedRoom.members.length);
                }
                return updatedRoom;
              });
              
              // Se lo status è cambiato a 'playing', avvia la sessione per tutti i membri
              if (updatedRoom.status === 'playing') {
                console.log('[RoomView] Room status is playing - checking movies...');
                if (updatedRoom.movies && updatedRoom.movies.length > 0) {
                  console.log('[RoomView] Starting session for all members with', updatedRoom.movies.length, 'movies');
                  // Piccolo delay per assicurarsi che lo stato sia aggiornato
                  setTimeout(() => {
                    onStartSession(updatedRoom.movies, roomCode, updatedRoom.id, updatedRoom.members.length);
                  }, 100);
                } else {
                  console.error('[RoomView] Room status is playing but no movies available');
                  showToast('Errore: la stanza non ha film. Contatta l\'host.', 'error');
                }
              } else if (updatedRoom.status === 'lobby') {
                // Rimuoviamo l'auto-start - l'host deve premere manualmente "Inizia Match"
                // Questo permette all'host di vedere quando tutti sono pronti prima di iniziare
              }
            } else {
              console.warn('[RoomView] Subscription callback received null room');
            }
          });
          } else {
            console.error('[RoomView] Room not found for subscription:', roomCode);
          }
        } catch (error) {
          console.error('[RoomView] Error setting up subscription:', error);
        }
      };
      
      setupSubscription();
      
      // Polling di fallback per assicurare che l'host veda i nuovi membri e il cambio di status
      // (in caso la subscription non funzioni correttamente)
      const pollInterval = setInterval(async () => {
        try {
          const currentRoom = await roomService.getRoom(roomCode);
          if (currentRoom) {
            setRoom(prevRoom => {
              if (!prevRoom) {
                console.log('[RoomView] Polling: first room load');
                return currentRoom;
              }
              
              // Aggiorna se lo status della stanza è cambiato a 'playing'
              if (prevRoom.status !== 'playing' && currentRoom.status === 'playing') {
                console.log('[RoomView] Polling detected room status change to playing!');
                // Avvia la sessione se lo status è playing e ci sono film
                if (currentRoom.movies && currentRoom.movies.length > 0) {
                  console.log('[RoomView] Polling: Starting session with', currentRoom.movies.length, 'movies');
                  setTimeout(() => {
                    onStartSession(currentRoom.movies, roomCode, currentRoom.id, currentRoom.members.length);
                  }, 100);
                }
                return currentRoom;
              }
              
              // Aggiorna solo se il numero di membri è cambiato o se ci sono differenze
              if (prevRoom.members.length !== currentRoom.members.length) {
                console.log('[RoomView] Polling detected member change:', prevRoom.members.length, '->', currentRoom.members.length);
                return currentRoom;
              }
              // Aggiorna anche se gli status sono cambiati
              const statusChanged = prevRoom.members.some((prevMember, idx) => {
                const currMember = currentRoom.members.find(m => m.id === prevMember.id);
                return !currMember || currMember.status !== prevMember.status;
              });
              if (statusChanged) {
                console.log('[RoomView] Polling detected status change');
                return currentRoom;
              }
              return prevRoom;
            });
          }
        } catch (error) {
          console.error('[RoomView] Error in polling:', error);
        }
      }, 1000); // Poll ogni 1 secondo per rilevare più velocemente il cambio di status

      return () => {
        if (unsubscribe) unsubscribe();
        clearInterval(pollInterval);
      };
    }
  }, [roomCode, step, onStartSession]);

  const handleSelectGenre = async (genreId: number) => {
    setLoading(true);
    let timeoutCleared = false;
    
    // Timeout di sicurezza - 8 secondi per dare tempo alle chiamate
    const timeoutId = setTimeout(() => {
      if (!timeoutCleared) {
        console.error('Timeout: handleSelectGenre took more than 8 seconds');
        showToast('Il caricamento sta impiegando troppo tempo. Verifica la connessione internet e riprova.', 'warning');
        setLoading(false);
      }
    }, 8000);
    
    try {
      console.log('=== STARTING GENRE SELECTION ===');
      console.log('Genre ID:', genreId);
      console.log('Timestamp:', new Date().toISOString());
      
      // Usa film di default immediatamente per velocità
      console.log('[1/4] Using default movies for instant room creation...');
      const defaultMovies = DEFAULT_MOVIES_BY_GENRE[genreId] || [];
      let movies: Movie[] = defaultMovies.slice(0, 15) as Movie[]; // Usa fino a 15 film di default
      
      if (movies.length === 0) {
        clearTimeout(timeoutId);
        console.error('[1/4] No default movies available for genre:', genreId);
        showToast('Nessun film di default disponibile per questo genere. Riprova.', 'error');
        setLoading(false);
        return;
      }
      
      console.log(`[1/4] Using ${movies.length} default movies for instant creation`);
      
      // Verifica autenticazione o crea guest ID
      console.log('[2/4] Checking authentication...');
      const authStartTime = Date.now();
      let user = await authService.getCurrentUser();
      const authTime = Date.now() - authStartTime;
      console.log(`[2/4] Auth check completed in ${authTime}ms`);
      
      // Se non autenticato, usa guest ID temporaneo
      if (!user) {
        console.log('User not authenticated - using guest ID');
        // Genera o recupera guest ID (deve essere un UUID valido)
        let guestId = localStorage.getItem('mm_guest_id');
        if (!guestId) {
          // Genera un UUID v4 valido per guest
          guestId = generateUUID();
          localStorage.setItem('mm_guest_id', guestId);
        }
        
        // Genera o recupera guest nickname
        let guestNickname = localStorage.getItem('mm_guest_nickname');
        if (!guestNickname) {
          guestNickname = 'Guest_' + Math.floor(Math.random() * 10000);
          localStorage.setItem('mm_guest_nickname', guestNickname);
        }
        
        // Crea oggetto user temporaneo per guest
        user = {
          id: guestId,
          nickname: guestNickname,
          provider: 'email' as const
        };
        console.log('Using guest user:', user.id, user.nickname);
        // Imposta currentUserId per guest
        setCurrentUserId(guestId);
      } else {
        console.log('User authenticated:', user.id, user.nickname);
        // Imposta currentUserId per utente autenticato
        setCurrentUserId(user.id);
      }
      
      // Crea stanza
      console.log('[3/4] Creating room in Supabase...');
      console.log('Room data:', {
        hostId: user.id,
        hostNickname: user.nickname,
        moviesCount: movies.length
      });
      const roomStartTime = Date.now();
      
      let newRoom: Room | null = null;
      try {
        console.log('[3/4] Calling roomService.createRoom...');
        newRoom = await roomService.createRoom(user.id, user.nickname, movies);
        
        console.log('[3/4] createRoom returned:', newRoom ? 'Room object' : 'null');
      } catch (roomError) {
        clearTimeout(timeoutId);
        console.error('[3/4] Exception in createRoom:', roomError);
        console.error('[3/4] Error type:', roomError instanceof Error ? roomError.constructor.name : typeof roomError);
        console.error('[3/4] Error stack:', roomError instanceof Error ? roomError.stack : 'No stack');
        
        const errorMessage = roomError instanceof Error ? roomError.message : 'Errore sconosciuto';
        console.error('[3/4] Full error message:', errorMessage);
        
        // Messaggio più dettagliato
        let userMessage = `Errore nella creazione della stanza: ${errorMessage}\n\n`;
        userMessage += `Verifica che:\n`;
        userMessage += `1. Le tabelle rooms e room_members siano state create in Supabase\n`;
        userMessage += `2. Hai eseguito lo schema SQL (supabase-rooms-schema.sql)\n`;
        userMessage += `3. Hai eseguito supabase-rooms-guest-support.sql per supporto guest\n`;
        userMessage += `4. Controlla la console per dettagli completi`;
        
        showToast(userMessage, 'error');
        setLoading(false);
        return;
      }
      
      const roomTime = Date.now() - roomStartTime;
      console.log(`[3/4] Room creation completed in ${roomTime}ms`);
      
      if (!newRoom) {
        clearTimeout(timeoutId);
        console.error('createRoom returned null');
        showToast('Errore nella creazione della stanza. Verifica la connessione e riprova.', 'error');
        setLoading(false);
        return;
      }
      
      console.log('[4/4] Room created successfully:', newRoom.code);
      console.log('Room details:', {
        id: newRoom.id,
        code: newRoom.code,
        membersCount: newRoom.members.length,
        moviesCount: newRoom.movies.length
      });
      
      // Imposta stato
      setRoomCode(newRoom.code);
      setRoom(newRoom);
      // Assicurati che currentUserId sia impostato correttamente
      if (!currentUserId || currentUserId !== user.id) {
        console.log('[Genre Selection] Setting currentUserId to:', user.id);
        setCurrentUserId(user.id);
      }
      
      // Salva riferimento alla stanza per l'update in background
      const roomCodeForUpdate = newRoom.code;
      
      // Carica film da TMDB in background (non bloccante) e aggiorna la stanza
      console.log('[Background] Starting TMDB load in background...');
      movieService.discoverByGenre(genreId).then(tmdbMovies => {
        if (tmdbMovies && tmdbMovies.length > 0) {
          console.log(`[Background] TMDB loaded ${tmdbMovies.length} movies, updating room ${roomCodeForUpdate}...`);
          roomService.updateRoomMovies(roomCodeForUpdate, tmdbMovies).then(updated => {
            if (updated) {
              console.log('[Background] ✓ Room updated with TMDB movies');
              // Aggiorna anche lo stato locale se siamo ancora nella stessa stanza
              if (roomCodeForUpdate === roomCode) {
                roomService.getRoom(roomCodeForUpdate).then(updatedRoom => {
                  if (updatedRoom) {
                    setRoom(updatedRoom);
                  }
                }).catch(err => {
                  console.warn('[Background] Error refreshing room state:', err);
                });
              }
            }
          }).catch(err => {
            console.warn('[Background] Error updating room with TMDB movies (non-critical):', err);
          });
        }
      }).catch(err => {
        console.warn('[Background] Error loading TMDB movies (non-critical, using defaults):', err);
      });
      
      // Incrementa statistiche (non bloccante, silenzioso)
      statsService.increment('rooms_created').catch(err => {
        console.warn('Error incrementing stats (non-critical, silent):', err);
      });
      
      timeoutCleared = true;
      clearTimeout(timeoutId);
      
      // Imposta step a lobby DOPO aver impostato roomCode e room
      console.log('Setting step to lobby...');
      
      // Piccolo delay per assicurare che il loading state sia aggiornato
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoading(false);
      setStep('lobby');
      
      console.log('=== GENRE SELECTION COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      timeoutCleared = true;
      clearTimeout(timeoutId);
      console.error('=== ERROR IN HANDLE SELECT GENRE ===');
      console.error('Error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      showToast(`Errore nel caricamento dei film: ${errorMessage}`, 'error');
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!roomCode) return;
    
    try {
      // Ricarica la stanza per assicurarsi di avere lo stato più aggiornato
      // Aspetta un attimo per assicurarsi che eventuali aggiornamenti di stato siano propagati
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const currentRoom = await roomService.getRoom(roomCode);
      if (!currentRoom) {
        console.error('Room not found');
        showToast('Stanza non trovata. Riprova.', 'error');
        return;
      }
      
      console.log('[RoomView] Checking members ready status:', {
        totalMembers: currentRoom.members.length,
        currentUserId,
        members: currentRoom.members.map(m => ({
          id: m.id,
          nickname: m.nickname,
          status: m.status,
          isHost: m.isHost,
          isCurrentUser: m.id === currentUserId
        }))
      });
      
      // Verifica che tutti i membri siano pronti
      const allMembersReady = currentRoom.members.every(m => m.status === 'ready');
      if (!allMembersReady) {
        const notReadyMembers = currentRoom.members.filter(m => m.status !== 'ready');
        const notReadyCount = notReadyMembers.length;
        console.log('[RoomView] Not all members ready:', {
          notReadyCount,
          notReadyMembers: notReadyMembers.map(m => ({ 
            id: m.id, 
            nickname: m.nickname, 
            status: m.status,
            isHost: m.isHost,
            isCurrentUser: m.id === currentUserId
          }))
        });
        showToast(`${notReadyCount} player non ancora pronti. Attendi che tutti siano pronti!`, 'warning');
        return;
      }
      
      if (currentRoom.members.length < 1) {
        showToast('Devi avere almeno un altro player nella stanza per iniziare!', 'warning');
        return;
      }
      
      if (!currentRoom.movies || currentRoom.movies.length === 0) {
        console.error('Room has no movies');
        showToast('La stanza non ha film. Attendi che vengano caricati.', 'warning');
        return;
      }
      
      console.log('[RoomView] Host starting session with', currentRoom.movies.length, 'movies...');
      const success = await roomService.startRoom(roomCode);
      
      if (success) {
        console.log('[RoomView] Room status updated to playing in database');
        
        // Aspetta un attimo per assicurarsi che il cambio di status sia propagato
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Ricarica la stanza per ottenere lo stato aggiornato
        const updatedRoom = await roomService.getRoom(roomCode);
        console.log('[RoomView] Room reloaded:', {
          status: updatedRoom?.status,
          moviesCount: updatedRoom?.movies?.length || 0,
          membersCount: updatedRoom?.members?.length || 0
        });
        
        if (updatedRoom && updatedRoom.status === 'playing' && updatedRoom.movies && updatedRoom.movies.length > 0) {
          console.log('[RoomView] Room confirmed as playing, starting session for host with', updatedRoom.movies.length, 'movies');
          // L'host entra immediatamente in sessione
          // Gli altri membri entreranno automaticamente tramite la subscription real-time
          onStartSession(updatedRoom.movies, roomCode, updatedRoom.id, updatedRoom.members.length);
        } else if (currentRoom.movies && currentRoom.movies.length > 0) {
          console.log('[RoomView] Using currentRoom movies as fallback:', currentRoom.movies.length, 'movies');
          // Fallback: usa i film della stanza corrente
          onStartSession(currentRoom.movies, roomCode, currentRoom.id, currentRoom.members.length);
        } else {
          console.error('[RoomView] No movies available in room!');
          showToast('Errore: la stanza non ha film disponibili. Riprova.', 'error');
        }
      } else {
        console.error('Failed to start room');
        showToast('Errore nell\'avvio della sessione. Riprova.', 'error');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      showToast('Errore nell\'avvio della sessione. Riprova.', 'error');
    }
  };
  
  // Determina se l'utente corrente è l'host
  // Confronta sia hostId che controlla se il membro corrente è host
  const isHost = room && currentUserId && (
    room.hostId === currentUserId || 
    room.members.some(m => m.id === currentUserId && m.isHost === true)
  );
  
  // Trova il membro corrente
  const currentMember = room?.members.find(m => m.id === currentUserId);
  const isCurrentMemberReady = currentMember?.status === 'ready';
  
  // Funzione per impostare "pronto"
  const setReady = async () => {
    if (!roomCode) {
      console.error('[RoomView] setReady: roomCode is missing');
      showToast('Errore: codice stanza non disponibile', 'error');
      return;
    }

    if (!currentUserId) {
      console.error('[RoomView] setReady: currentUserId is missing');
      showToast('Errore: utente non identificato', 'error');
      return;
    }
    
    console.log('[RoomView] setReady called with:', { roomCode, currentUserId });
    
    try {
      const success = await roomService.updateMemberStatus(roomCode, currentUserId, 'ready');
      if (success) {
        console.log('[RoomView] Member status set to ready successfully');
        // La subscription aggiornerà automaticamente la stanza
        // Forza un piccolo delay per assicurare propagazione
        setTimeout(() => {
          roomService.getRoom(roomCode).then(updatedRoom => {
            if (updatedRoom) {
              console.log('[RoomView] Manually reloaded room after setReady');
              setRoom(updatedRoom);
            }
          });
        }, 200);
      } else {
        console.error('[RoomView] Failed to set ready status');
        showToast('Errore nell\'impostazione dello status. Riprova.', 'error');
      }
    } catch (error) {
      console.error('[RoomView] Error setting ready:', error);
      showToast('Errore imprevisto. Riprova.', 'error');
    }
  };
  
  // Funzione per annullare la sessione (solo host)
  const cancelSession = async () => {
    if (!roomCode || !isHost) return;
    
    if (!confirm('Vuoi annullare la sessione?')) return;
    
    try {
      const success = await roomService.cancelRoom(roomCode);
      if (success) {
        console.log('[RoomView] Session cancelled');
        // La subscription aggiornerà automaticamente la stanza
      } else {
        console.error('[RoomView] Failed to cancel session');
        showToast('Errore nell\'annullamento della sessione', 'error');
      }
    } catch (error) {
      console.error('[RoomView] Error cancelling session:', error);
      showToast('Errore nell\'annullamento della sessione', 'error');
    }
  };
  
  // Debug logging per isHost
  useEffect(() => {
    if (room && currentUserId) {
      const hostMember = room.members.find(m => m.isHost === true);
      const isHostById = room.hostId === currentUserId;
      const isHostByMember = room.members.some(m => m.id === currentUserId && m.isHost === true);
      const calculatedIsHost = isHostById || isHostByMember;
      console.log('[RoomView] Host check:', {
        roomHostId: room.hostId,
        currentUserId: currentUserId,
        isHostById: isHostById,
        isHostByMember: isHostByMember,
        isHost: calculatedIsHost,
        hostMember: hostMember ? { id: hostMember.id, nickname: hostMember.nickname } : null,
        allMembers: room.members.map(m => ({ id: m.id, nickname: m.nickname, isHost: m.isHost, status: m.status }))
      });
    }
  }, [room, currentUserId]);

  // Funzioni per modalità manuale - ricerca automatica con debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    let isMounted = true;
    
    const searchTimeout = setTimeout(async () => {
      if (!isMounted) return;
      
      setIsSearching(true);
      try {
        const results = await movieService.searchMovies(searchQuery);
        if (isMounted) {
          setSearchResults(results);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error searching movies:', error);
          setSearchResults([]);
        }
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    }, 500); // Debounce di 500ms
    
    return () => {
      isMounted = false;
      clearTimeout(searchTimeout);
    };
  }, [searchQuery]);

  const addMovieToManualList = (movie: Movie) => {
    if (manualMovies.find(m => m.id === movie.id)) {
      showToast('Film già aggiunto', 'info');
      return;
    }
    setManualMovies([...manualMovies, movie]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMovieFromManualList = (movieId: number) => {
    setManualMovies(manualMovies.filter(m => m.id !== movieId));
  };

  const handleCreateManualRoom = async () => {
    if (manualMovies.length === 0) {
      showToast('Aggiungi almeno un film prima di creare la stanza', 'warning');
      return;
    }
    
    setLoading(true);
    let timeoutCleared = false;
    
    // Timeout totale di 5 secondi per la creazione stanza manuale
    const timeoutId = setTimeout(() => {
      if (!timeoutCleared) {
        console.error('Timeout: handleCreateManualRoom took more than 5 seconds');
        showToast('La creazione della stanza sta impiegando troppo tempo. Verifica la connessione internet e riprova.', 'warning');
        setLoading(false);
      }
    }, 5000);
    
    // Flag per controllare se il componente è ancora montato
    let isMounted = true;
    
    try {
      console.log('[Manual Room] Starting room creation...');
      const startTime = Date.now();
      
      // Ottimizza getCurrentUser con timeout
      console.log('[Manual Room] Checking authentication...');
      let user: any = null;
      try {
        const userPromise = authService.getCurrentUser();
        const userTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), 2000);
        });
        
        user = await Promise.race([userPromise, userTimeout]);
      } catch (authError: any) {
        if (authError?.message === 'Auth check timeout') {
          console.warn('[Manual Room] Auth check timeout - using guest');
        } else {
          console.warn('[Manual Room] Auth check error:', authError);
        }
      }
      
      if (!isMounted) {
        timeoutCleared = true;
        clearTimeout(timeoutId);
        return;
      }
      
      if (!user) {
        console.log('[Manual Room] Using guest user');
        let guestId = localStorage.getItem('mm_guest_id');
        if (!guestId) {
          guestId = generateUUID();
          localStorage.setItem('mm_guest_id', guestId);
        }
        
        let guestNickname = localStorage.getItem('mm_guest_nickname');
        if (!guestNickname) {
          guestNickname = 'Guest_' + Math.floor(Math.random() * 10000);
          localStorage.setItem('mm_guest_nickname', guestNickname);
        }
        
        user = {
          id: guestId,
          nickname: guestNickname,
          provider: 'email' as const
        };
        // Imposta currentUserId per guest
        setCurrentUserId(guestId);
      } else {
        // Imposta currentUserId per utente autenticato
        setCurrentUserId(user.id);
      }
      
      if (!isMounted) {
        timeoutCleared = true;
        clearTimeout(timeoutId);
        return;
      }
      
      console.log('[Manual Room] Creating room in Supabase...');
      const roomStartTime = Date.now();
      const newRoom = await roomService.createRoom(user.id, user.nickname, manualMovies);
      const roomTime = Date.now() - roomStartTime;
      console.log(`[Manual Room] Room created in ${roomTime}ms`);
      
      if (!isMounted) {
        timeoutCleared = true;
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }
      
      if (!newRoom) {
        timeoutCleared = true;
        clearTimeout(timeoutId);
        showToast('Errore nella creazione della stanza', 'error');
        setLoading(false);
        return;
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`[Manual Room] ✓ Total time: ${totalTime}ms`);
      
      setRoomCode(newRoom.code);
      setRoom(newRoom);
      // Assicurati che currentUserId sia impostato correttamente
      if (!currentUserId || currentUserId !== user.id) {
        console.log('[Manual Room] Setting currentUserId to:', user.id);
        setCurrentUserId(user.id);
      }
      
      // Statistiche non bloccanti
      statsService.increment('rooms_created').catch(err => {
        console.warn('Error incrementing stats (non-critical):', err);
      });
      
      timeoutCleared = true;
      clearTimeout(timeoutId);
      setLoading(false);
      setStep('lobby');
    } catch (error) {
      timeoutCleared = true;
      clearTimeout(timeoutId);
      
      if (!isMounted) return;
      
      console.error('[Manual Room] Error creating room:', error);
      
      // Ignora errori di navigazione/chiusura browser
      if (error instanceof Error && error.message.includes('browsing context')) {
        console.warn('Browser context closed, ignoring error');
        return;
      }
      
      showToast('Errore nella creazione della stanza: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'), 'error');
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 bg-black dark:bg-white transition-colors duration-500">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-white/5 dark:border-black/10 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin transition-colors duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <Sparkles size={24} className="text-red-500 dark:text-red-600" />
            </div>
        </div>
        <p className="font-black text-xs uppercase tracking-[0.4em] opacity-30 dark:opacity-60 text-white dark:text-black transition-opacity duration-500">Discovery in corso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-4 bg-black dark:bg-white text-white dark:text-black transition-colors duration-500 overflow-y-auto">
      <header className="flex items-center gap-4 mb-10">
        <HapticButton onClick={onBack} className="p-3 bg-white/5 dark:bg-black/10 rounded-full border border-white/10 dark:border-black/20 active:bg-white/10 dark:active:bg-black/20 transition-colors duration-500">
          <ChevronLeft className="text-white dark:text-black" />
        </HapticButton>
        <h1 className="text-2xl font-black italic tracking-tight uppercase text-white dark:text-black transition-colors duration-500">
          {step === 'lobby' ? 'Lobby Stanza' : step === 'code' ? 'Entra in Stanza' : 'Configurazione'}
        </h1>
      </header>

      {step === 'type' && (
        <div className="flex flex-col gap-5 pb-20">
           <HapticButton 
            onClick={() => setStep('genre')}
            className="p-8 bg-[#1C1C1E] dark:bg-gray-100 rounded-[40px] border border-white/10 dark:border-black/20 flex items-center gap-6 active:scale-[0.97] transition-all"
           >
              <div className="p-5 bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-500 dark:to-indigo-600 rounded-3xl text-white shadow-xl transition-colors duration-500"><Wand2 size={32}/></div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-black italic uppercase tracking-tight text-white dark:text-black">Per Genere</h3>
                <p className="text-[10px] font-bold opacity-30 dark:opacity-60 mt-1 uppercase tracking-widest text-white dark:text-black">Discovery rapida</p>
              </div>
           </HapticButton>

           <HapticButton 
            onClick={() => {
              setStep('manual');
              setManualMovies([]);
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="p-8 bg-[#1C1C1E] rounded-[40px] border border-white/10 flex items-center gap-6 active:scale-[0.97] transition-all"
           >
              <div className="p-5 bg-gradient-to-br from-blue-600 to-cyan-700 dark:from-blue-500 dark:to-cyan-600 rounded-3xl text-white shadow-xl transition-colors duration-500"><List size={32}/></div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-black italic uppercase tracking-tight text-white dark:text-black">Manuale</h3>
                <p className="text-[10px] font-bold opacity-30 dark:opacity-60 mt-1 uppercase tracking-widest text-white dark:text-black">Cerca e seleziona</p>
              </div>
           </HapticButton>
        </div>
      )}

      {step === 'code' && (
        <div className="flex-1 flex flex-col space-y-8 pb-40">
          {/* Animazione grafica nella parte alta */}
          <div className="relative h-32 -mx-6 -mt-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-purple-600/20 to-indigo-600/20 dark:from-red-500/20 dark:via-purple-500/20 dark:to-indigo-500/20"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-red-600/30 to-purple-600/30 dark:from-red-500/30 dark:to-purple-500/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-indigo-600/30 to-blue-600/30 dark:from-indigo-500/30 dark:to-blue-500/30 rounded-full blur-2xl"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-center"
              >
                <Sparkles size={48} className="text-red-500 dark:text-red-400 mx-auto mb-2" />
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest text-white dark:text-black">
                  Unisciti alla Stanza
                </p>
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-1 block">
              Inserisci Codice Stanza
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-2xl px-6 py-4 font-black text-4xl text-center tracking-[0.2em] focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 uppercase shadow-lg"
              style={{ fontFamily: 'monospace' }}
            />
            <p className="text-[9px] font-black opacity-20 uppercase tracking-widest text-center">
              Il codice è di 6 caratteri
            </p>
          </div>
          
          <HapticButton
            onClick={async () => {
              if (roomCode.length !== 6) {
                showToast('Il codice deve essere di 6 caratteri', 'warning');
                return;
              }
              
              setLoading(true);
              try {
                console.log('Joining room with code:', roomCode);
                
                // Verifica autenticazione o crea guest ID
                console.log('Checking authentication...');
                let user = await authService.getCurrentUser();
                
                // Se non autenticato, usa guest ID temporaneo
                if (!user) {
                  console.log('User not authenticated - using guest ID');
                  // Genera o recupera guest ID (deve essere un UUID valido)
                  let guestId = localStorage.getItem('mm_guest_id');
                  if (!guestId) {
                    // Genera un UUID v4 valido per guest
                    guestId = generateUUID();
                    localStorage.setItem('mm_guest_id', guestId);
                  }
                  
                  // Genera o recupera guest nickname
                  let guestNickname = localStorage.getItem('mm_guest_nickname');
                  if (!guestNickname) {
                    guestNickname = 'Guest_' + Math.floor(Math.random() * 10000);
                    localStorage.setItem('mm_guest_nickname', guestNickname);
                  }
                  
                  // Crea oggetto user temporaneo per guest
                  user = {
                    id: guestId,
                    nickname: guestNickname,
                    provider: 'email' as const
                  };
                  console.log('Using guest user:', user.id, user.nickname);
                  // Imposta currentUserId per guest
                  setCurrentUserId(guestId);
                } else {
                  console.log('User authenticated:', user.id);
                  // Imposta currentUserId per utente autenticato
                  setCurrentUserId(user.id);
                }
                
                // Verifica che la stanza esista
                console.log('Checking if room exists...');
                const foundRoom = await roomService.getRoom(roomCode);
                if (!foundRoom) {
                  console.error('Room not found:', roomCode);
                  showToast('Stanza non trovata. Controlla il codice e assicurati che la stanza sia stata creata.', 'error');
                  setLoading(false);
                  return;
                }
                console.log('Room found:', foundRoom.code);
                
                // Unisciti alla stanza
                console.log('Joining room...');
                const joinedRoom = await roomService.joinRoom(roomCode, user.id, user.nickname);
                if (!joinedRoom) {
                  console.error('Failed to join room');
                  showToast('Errore nell\'entrare nella stanza. Riprova.', 'error');
                  setLoading(false);
                  return;
                }
                
                console.log('Successfully joined room:', joinedRoom.code);
                console.log('[Join Room] Setting currentUserId to:', user.id);
                setCurrentUserId(user.id);
                setRoom(joinedRoom);
                
                // Incrementa statistiche (non bloccante)
                try {
                  await statsService.increment('rooms_joined');
                } catch (statsError) {
                  console.warn('Error incrementing stats (non-critical):', statsError);
                }
                
                // Imposta loading a false PRIMA di cambiare step
                setLoading(false);
                
                // Cambia step a lobby DOPO aver fermato il loading
                console.log('Setting step to lobby after join...');
                setTimeout(() => {
                  setStep('lobby');
                }, 100);
              } catch (error) {
                console.error('Error in join room:', error);
                console.error('Error details:', {
                  message: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined
                });
                showToast('Errore nell\'entrare nella stanza: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'), 'error');
                setLoading(false);
              }
            }}
            disabled={roomCode.length !== 6 || loading}
            className="w-full py-6 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-blue-500 dark:via-indigo-600 dark:to-purple-700 text-white rounded-[32px] font-black text-xl italic uppercase tracking-widest shadow-2xl shadow-blue-600/30 dark:shadow-blue-500/30 active:scale-[0.96] transition-all disabled:opacity-30 disabled:cursor-not-allowed sticky bottom-4 z-10"
          >
            {loading ? 'Caricamento...' : 'Entra in Stanza'}
          </HapticButton>
        </div>
      )}

      {step === 'genre' && (
        <div className="grid grid-cols-2 gap-3 pb-40 overflow-y-auto no-scrollbar">
          {GENRES.map(g => (
            <HapticButton 
              key={g.id}
              onClick={() => handleSelectGenre(g.id)}
              className="bg-[#1C1C1E] dark:bg-gray-100 p-6 rounded-[32px] flex flex-col items-center gap-3 border border-white/5 dark:border-black/20 ios-card-shadow active:scale-95 transition-all"
            >
              <span className="text-4xl drop-shadow-lg">{g.icon}</span>
              <span className="font-black uppercase italic text-xs tracking-[0.1em] text-white dark:text-black">{g.name}</span>
            </HapticButton>
          ))}
        </div>
      )}

      {step === 'manual' && (
        <div className="flex-1 flex flex-col space-y-4 pb-40 overflow-y-auto">
          {/* Barra di ricerca - sticky per evitare interferenza con tastiera */}
          <div className="space-y-3 sticky top-0 z-20 bg-black/80 dark:bg-white/80 backdrop-blur-xl pb-2 -mx-6 px-6 pt-2">
            <div className="relative">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 dark:text-black/40 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca film..."
                className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[24px] pl-14 pr-5 py-4 font-bold text-sm focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
                onFocus={() => {
                  // Scrolla leggermente in alto quando la tastiera si apre
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 300);
                }}
              />
              {isSearching && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-white/20 dark:border-black/20 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Suggerimenti inline invece di dropdown */}
            {isSearching && (
              <div className="p-4 text-center bg-white/5 dark:bg-black/10 rounded-[20px] border border-white/10 dark:border-black/20">
                <div className="w-6 h-6 border-2 border-white/20 dark:border-black/20 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-black opacity-60 dark:opacity-70 uppercase tracking-widest text-white dark:text-black">Ricerca in corso...</p>
              </div>
            )}

            {/* Risultati come lista inline con animazione e posizionamento intelligente */}
            <AnimatePresence>
              {!isSearching && searchQuery.trim() && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <p className="text-[10px] font-black opacity-50 dark:opacity-60 uppercase tracking-widest px-2 text-white dark:text-black">
                    Suggerimenti ({searchResults.length})
                  </p>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                    {searchResults.slice(0, 5).map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <HapticButton
                          onClick={() => {
                            addMovieToManualList(movie);
                            setSearchQuery('');
                            setSearchResults([]);
                            // Chiudi la tastiera virtuale
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                          }}
                          className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl hover:bg-white/15 dark:hover:bg-black/30 p-3 rounded-[20px] flex items-center gap-3 border border-white/20 dark:border-black/30 active:scale-[0.98] transition-all duration-200 group shadow-lg"
                        >
                          {movie.poster ? (
                            <img 
                              src={movie.poster} 
                              alt={movie.title} 
                              className="w-12 h-18 object-cover rounded-lg shadow-lg"
                            />
                          ) : (
                            <div className="w-12 h-18 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                              <span className="text-[8px] font-black opacity-50">No</span>
                            </div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <h4 className="font-black text-sm truncate text-white dark:text-black">{movie.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] opacity-70 text-white dark:text-black">
                              <span className="font-bold">{movie.year}</span>
                              <span>•</span>
                              <span className="text-yellow-500">★ {movie.rating}</span>
                            </div>
                          </div>
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check size={20} className="text-green-500" />
                          </motion.div>
                        </HapticButton>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
              <div className="p-4 text-center bg-white/5 dark:bg-black/10 rounded-[20px] border border-white/10 dark:border-black/20">
                <p className="text-xs font-black opacity-60 dark:opacity-70 uppercase tracking-widest text-white dark:text-black">Nessun risultato</p>
                <p className="text-[10px] font-black opacity-40 dark:opacity-50 mt-1 text-white dark:text-black">Prova con un altro titolo</p>
              </div>
            )}
          </div>

          {/* Lista film selezionati */}
          {manualMovies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black opacity-30 uppercase tracking-widest px-1">
                Film Selezionati ({manualMovies.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {manualMovies.map(movie => (
                  <div
                    key={movie.id}
                    className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-white/5"
                  >
                    {movie.poster && (
                      <img src={movie.poster} alt={movie.title} className="w-16 h-24 object-cover rounded-xl" />
                    )}
                    <div className="flex-1 text-left">
                      <h4 className="font-black text-sm">{movie.title}</h4>
                      <p className="text-[10px] opacity-50">{movie.year} • {movie.rating}/10</p>
                    </div>
                    <HapticButton
                      onClick={() => removeMovieFromManualList(movie.id)}
                      className="p-2 bg-red-600/20 rounded-xl active:bg-red-600/30 transition-colors"
                    >
                      <X size={16} className="text-red-500" />
                    </HapticButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pulsante crea stanza - sticky per mobile */}
          <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-black via-black to-transparent dark:from-white dark:via-white pb-4 -mx-6 px-6 mt-4">
            <HapticButton
              onClick={handleCreateManualRoom}
              disabled={manualMovies.length === 0 || loading}
              className="w-full py-5 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 dark:from-red-500 dark:via-purple-600 dark:to-indigo-700 text-white rounded-[32px] font-black text-lg italic uppercase tracking-widest shadow-2xl shadow-purple-600/30 dark:shadow-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96] transition-all"
            >
              {loading ? 'Creazione...' : `Crea Stanza (${manualMovies.length} film)`}
            </HapticButton>
          </div>
        </div>
      )}

      {step === 'lobby' && (
        <div className="flex-1 flex flex-col space-y-6 pb-28">
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl rounded-[32px] p-6 text-center space-y-4 border border-white/20 dark:border-black/30 shadow-2xl relative overflow-hidden">
            {/* Icona condivisione in alto a destra */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95, rotate: -5 }}
              onClick={async () => {
                try {
                  // Condivisione nativa (stile iPhone)
                  if (navigator.share) {
                    await navigator.share({
                      title: 'MovieMatch - Unisciti alla mia stanza',
                      text: `Unisciti alla mia stanza MovieMatch! Codice: ${roomCode}`,
                      url: window.location.href
                    });
                  } else {
                    // Fallback: copia codice e apri SMS
                    await navigator.clipboard.writeText(roomCode);
                    const smsLink = `sms:?body=${encodeURIComponent(`Unisciti alla mia stanza MovieMatch! Codice: ${roomCode}`)}`;
                    window.location.href = smsLink;
                  }
                } catch (err) {
                  // Se l'utente annulla la condivisione, non fare nulla
                  if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                    // Fallback: copia solo il codice
                    try {
                      await navigator.clipboard.writeText(roomCode);
                      showToast('Codice copiato!', 'success');
                    } catch (copyErr) {
                      console.error('Error copying:', copyErr);
                    }
                  }
                }
              }}
              className="absolute top-3 right-3 z-20 p-2.5 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-full border border-white/20 dark:border-black/30 shadow-lg hover:bg-white/15 dark:hover:bg-black/30 transition-all group"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              >
                <Share size={18} className="text-white dark:text-black group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
              </motion.div>
            </motion.button>
            
            {/* Effetti liquid glass - sistemato per evitare parti nere */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-black/20 dark:via-black/10 dark:to-transparent rounded-[32px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-24 h-24 bg-red-600/10 dark:bg-red-500/10 blur-3xl rounded-full -ml-12 -mt-12 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-600/10 dark:bg-purple-500/10 blur-3xl rounded-full -mr-16 -mb-16 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-indigo-600/5 dark:bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <p className="text-[9px] font-black opacity-40 dark:opacity-60 uppercase tracking-[0.4em] mb-2 text-white dark:text-black">Codice Accesso</p>
              <h2 className="text-4xl font-black text-red-600 dark:text-red-500 font-mono tracking-[0.1em] drop-shadow-lg">{roomCode}</h2>
            </div>
            
            <div className="relative z-10">
              <HapticButton 
                onClick={async () => {
                  try {
                    // Copia solo il codice
                    await navigator.clipboard.writeText(roomCode);
                    showToast('Codice copiato!', 'success');
                  } catch (err) {
                    console.error('Error copying:', err);
                  }
                }}
                className="px-6 py-2.5 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-full font-black uppercase text-[9px] tracking-widest flex items-center gap-2 mx-auto active:bg-white/15 dark:active:bg-black/30 transition-all border border-white/20 dark:border-black/30 shadow-lg"
              >
                <Copy size={12} /> Copia Codice
              </HapticButton>
            </div>
          </div>

          <div className="flex-1 space-y-3">
             <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Users size={12} /> Membri Online ({room?.members.length || 0})
             </h3>
             {room?.members.map((member) => {
               const isCurrentUser = currentUserId && member.id === currentUserId;
               const isReady = member.status === 'ready';
               return (
                 <div key={member.id} className="bg-white/5 p-4 rounded-[24px] flex items-center gap-3 border border-white/5 relative overflow-hidden">
                   {/* Effetto glow se pronto */}
                   {isReady && (
                     <div className="absolute inset-0 bg-green-500/10 blur-xl pointer-events-none" />
                   )}
                   <div className={`w-12 h-12 bg-gradient-to-br ${member.isHost ? 'from-red-600 to-purple-600' : 'from-blue-600 to-indigo-600'} rounded-full flex items-center justify-center font-black shadow-xl text-sm relative z-10 ${isReady ? 'ring-2 ring-green-500/50' : ''}`}>
                     {member.nickname.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-1 min-w-0 relative z-10">
                     <span className="font-black italic uppercase text-xs truncate block">
                       {member.nickname} {member.isHost ? '(Host)' : ''}
                     </span>
                     <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isReady ? 'text-green-400' : 'text-white/40 dark:text-black/40'}`}>
                       {isReady ? '✓ Pronto' : 'In attesa...'}
                     </p>
                   </div>
                   <div className="relative z-10">
                     <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                   </div>
                 </div>
               );
             })}
          </div>

          <div className="sticky bottom-0 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent dark:from-white dark:via-white/95 pb-4 -mx-6 px-6 z-10 space-y-3">
            {isHost ? (
              <>
                {/* Pulsante X per annullare (solo se in playing) */}
                {room?.status === 'playing' && (
                  <HapticButton
                    onClick={cancelSession}
                    className="w-full py-2.5 bg-red-600/20 dark:bg-red-500/20 backdrop-blur-xl rounded-[16px] border border-red-600/30 dark:border-red-500/30 flex items-center justify-center gap-2 active:bg-red-600/30 dark:active:bg-red-500/30 transition-all"
                  >
                    <X size={14} className="text-red-400 dark:text-red-500" />
                    <span className="text-red-400 dark:text-red-500 font-black text-[10px] uppercase tracking-wider">Annulla Sessione</span>
                  </HapticButton>
                )}
                
                {/* Pulsante Inizia Match */}
                <HapticButton 
                  onClick={startSession}
                  className="group w-full py-4 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 dark:from-red-500 dark:via-purple-600 dark:to-indigo-700 text-white rounded-[24px] font-black text-base italic uppercase tracking-widest shadow-2xl shadow-purple-600/30 dark:shadow-purple-500/30 active:scale-[0.96] transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <Play fill="currentColor" size={20} className="animate-pulse" />
                    Inizia Match
                  </div>
                </HapticButton>
              </>
            ) : (
              /* Pulsante Pronto in stile liquid glass Apple/Netflix */
              <HapticButton
                onClick={setReady}
                disabled={isCurrentMemberReady}
                className={`group relative w-full py-4 rounded-[28px] font-black text-sm italic uppercase tracking-wider overflow-hidden transition-all ${
                  isCurrentMemberReady 
                    ? 'bg-gradient-to-br from-green-500/30 via-emerald-500/30 to-teal-500/30 dark:from-green-400/40 dark:via-emerald-400/40 dark:to-teal-400/40 border border-green-500/40 dark:border-green-400/50 text-green-300 dark:text-green-200 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-red-600/40 dark:from-purple-500/50 dark:via-pink-500/50 dark:to-red-500/50 border border-white/20 dark:border-white/30 text-white dark:text-white active:scale-[0.97]'
                } backdrop-blur-2xl shadow-2xl`}
              >
                {/* Effetti liquid glass */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-400/20 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-400/20 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                
                {/* Shine effect animato */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                />
                
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isCurrentMemberReady ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Check size={18} className="text-green-300 dark:text-green-200" strokeWidth={3} />
                      </motion.div>
                      <span>Pronto</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Play size={16} className="ml-0.5" fill="currentColor" />
                      </motion.div>
                      <span>Pronto</span>
                    </>
                  )}
                </div>
              </HapticButton>
            )}
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};
