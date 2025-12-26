
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
  onStartSession: (movies: Movie[]) => void;
  mode: 'create' | 'join';
}

export const RoomView: React.FC<Props> = ({ onBack, onStartSession, mode }) => {
  const [step, setStep] = useState<'type' | 'genre' | 'manual' | 'lobby' | 'code'>(mode === 'create' ? 'type' : 'code');
  const [roomCode, setRoomCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Stati per modalità manuale
  const [manualMovies, setManualMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Carica user ID
    authService.getCurrentUser().then(user => {
      if (user) setCurrentUserId(user.id);
    });
    
    if (roomCode && step === 'lobby') {
      // Carica stanza dal database
      roomService.getRoom(roomCode).then(currentRoom => {
        if (currentRoom) {
          setRoom(currentRoom);
        }
      });

      // Sottoscrivi agli aggiornamenti real-time
      let unsubscribe: (() => void) | null = null;
      
      // Carica stanza e poi sottoscrivi
      roomService.getRoom(roomCode).then(room => {
        if (room) {
          unsubscribe = roomService.subscribeToRoom(roomCode, (updatedRoom) => {
            if (updatedRoom) {
              setRoom(updatedRoom);
            }
          });
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [roomCode, step]);

  const handleSelectGenre = async (genreId: number) => {
    setLoading(true);
    let timeoutCleared = false;
    
    // Timeout di sicurezza - 8 secondi per dare tempo alle chiamate
    const timeoutId = setTimeout(() => {
      if (!timeoutCleared) {
        console.error('Timeout: handleSelectGenre took more than 8 seconds');
        alert('Il caricamento sta impiegando troppo tempo. Verifica la connessione internet e riprova.');
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
        alert('Nessun film di default disponibile per questo genere. Riprova.');
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
      } else {
        console.log('User authenticated:', user.id, user.nickname);
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
        const createRoomPromise = roomService.createRoom(user.id, user.nickname, movies);
        
        // Aggiungi timeout per la creazione stanza (20 secondi)
        const roomTimeout = setTimeout(() => {
          console.error('[3/4] Room creation timeout after 20 seconds');
        }, 20000);
        
        newRoom = await createRoomPromise;
        clearTimeout(roomTimeout);
        
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
        
        alert(userMessage);
        setLoading(false);
        return;
      }
      
      const roomTime = Date.now() - roomStartTime;
      console.log(`[3/4] Room creation completed in ${roomTime}ms`);
      
      if (!newRoom) {
        clearTimeout(timeoutId);
        console.error('createRoom returned null');
        alert('Errore nella creazione della stanza. La funzione ha restituito null. Verifica che le tabelle rooms e room_members siano state create in Supabase. Controlla la console per dettagli.');
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
      alert(`Errore nel caricamento dei film: ${errorMessage}\n\nControlla la console per dettagli. Verifica che le tabelle rooms e room_members siano state create in Supabase.`);
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!roomCode) return;
    const currentRoom = await roomService.getRoom(roomCode);
    if (currentRoom) {
      await roomService.startRoom(roomCode);
      onStartSession(currentRoom.movies);
    }
  };

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
      alert('Film già aggiunto');
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
      alert('Aggiungi almeno un film prima di creare la stanza');
      return;
    }
    
    setLoading(true);
    
    // Flag per controllare se il componente è ancora montato
    let isMounted = true;
    
    try {
      let user = await authService.getCurrentUser();
      
      if (!isMounted) return;
      
      if (!user) {
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
      }
      
      if (!isMounted) return;
      
      const newRoom = await roomService.createRoom(user.id, user.nickname, manualMovies);
      
      if (!isMounted) {
        setLoading(false);
        return;
      }
      
      if (!newRoom) {
        alert('Errore nella creazione della stanza');
        setLoading(false);
        return;
      }
      
      setRoomCode(newRoom.code);
      setRoom(newRoom);
      
      // Statistiche non bloccanti
      statsService.increment('rooms_created').catch(err => {
        console.warn('Error incrementing stats (non-critical):', err);
      });
      
      setLoading(false);
      setStep('lobby');
    } catch (error) {
      if (!isMounted) return;
      
      console.error('Error creating manual room:', error);
      
      // Ignora errori di navigazione/chiusura browser
      if (error instanceof Error && error.message.includes('browsing context')) {
        console.warn('Browser context closed, ignoring error');
        return;
      }
      
      alert('Errore nella creazione della stanza: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
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
    <div className="flex flex-col h-full px-6 pt-16 bg-black dark:bg-white text-white dark:text-black transition-colors duration-500">
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
                alert('Il codice deve essere di 6 caratteri');
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
                } else {
                  console.log('User authenticated:', user.id);
                }
                
                // Verifica che la stanza esista
                console.log('Checking if room exists...');
                const foundRoom = await roomService.getRoom(roomCode);
                if (!foundRoom) {
                  console.error('Room not found:', roomCode);
                  alert('Stanza non trovata. Controlla il codice e assicurati che la stanza sia stata creata.');
                  setLoading(false);
                  return;
                }
                console.log('Room found:', foundRoom.code);
                
                // Unisciti alla stanza
                console.log('Joining room...');
                const joinedRoom = await roomService.joinRoom(roomCode, user.id, user.nickname);
                if (!joinedRoom) {
                  console.error('Failed to join room');
                  alert('Errore nell\'entrare nella stanza. Controlla la console per dettagli.');
                  setLoading(false);
                  return;
                }
                
                console.log('Successfully joined room:', joinedRoom.code);
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
                alert('Errore nell\'entrare nella stanza: ' + (error instanceof Error ? error.message : 'Errore sconosciuto') + '. Controlla la console per dettagli.');
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
          {/* Barra di ricerca */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 dark:text-black/40 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca film..."
                className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[24px] pl-14 pr-5 py-4 font-bold text-sm focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
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
        <div className="flex-1 flex flex-col space-y-10 pb-10">
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl rounded-[48px] p-10 text-center space-y-6 border border-white/20 dark:border-black/30 shadow-2xl relative overflow-hidden">
            {/* Effetti liquid glass */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-black/20 dark:via-black/10 dark:to-transparent rounded-[48px]" />
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/10 dark:bg-red-500/10 blur-3xl rounded-full -ml-16 -mt-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-600/10 dark:bg-purple-500/10 blur-3xl rounded-full -mr-20 -mb-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-indigo-600/5 dark:bg-indigo-500/5 blur-2xl rounded-full" />
            
            <div className="relative z-10">
              <p className="text-[10px] font-black opacity-40 dark:opacity-60 uppercase tracking-[0.5em] mb-3 text-white dark:text-black">Codice Accesso</p>
              <h2 className="text-6xl font-black text-red-600 dark:text-red-500 font-mono tracking-[0.1em] drop-shadow-lg">{roomCode}</h2>
            </div>
            
            <div className="flex flex-col gap-3 relative z-10">
              <HapticButton 
                onClick={async () => {
                  try {
                    // Copia solo il codice
                    await navigator.clipboard.writeText(roomCode);
                    alert('Codice copiato!');
                  } catch (err) {
                    console.error('Error copying:', err);
                  }
                }}
                className="px-8 py-3 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto active:bg-white/15 dark:active:bg-black/30 transition-all border border-white/20 dark:border-black/30 shadow-lg"
              >
                <Copy size={14} /> Copia Codice
              </HapticButton>
              
              <HapticButton 
                onClick={async () => {
                  try {
                    // Condivisione SMS con solo il codice
                    if (navigator.share) {
                      await navigator.share({
                        text: roomCode
                      });
                    } else {
                      // Fallback: copia e mostra messaggio SMS
                      await navigator.clipboard.writeText(roomCode);
                      const smsLink = `sms:?body=${encodeURIComponent(roomCode)}`;
                      window.location.href = smsLink;
                    }
                  } catch (err) {
                    // Se l'utente annulla la condivisione, non fare nulla
                    if (err instanceof Error && err.name !== 'AbortError') {
                      console.error('Error sharing:', err);
                    }
                  }
                }}
                className="px-8 py-3 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto active:bg-white/15 dark:active:bg-black/30 transition-all border border-white/20 dark:border-black/30 shadow-lg"
              >
                <MessageSquare size={14} /> Invia SMS
              </HapticButton>
            </div>
          </div>

          <div className="flex-1 space-y-5">
             <h3 className="text-xs font-black opacity-30 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                <Users size={14} /> Membri Online ({room?.members.length || 0})
             </h3>
             {room?.members.map((member) => {
               const isCurrentUser = currentUserId && member.id === currentUserId;
               return (
                 <div key={member.id} className="bg-white/5 p-5 rounded-[32px] flex items-center gap-4 border border-white/5">
                   <div className={`w-14 h-14 bg-gradient-to-br ${member.isHost ? 'from-red-600 to-purple-600' : 'from-blue-600 to-indigo-600'} rounded-full flex items-center justify-center font-black shadow-xl`}>
                     {member.nickname.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-1">
                     <span className="font-black italic uppercase text-sm">
                       {member.nickname} {member.isHost ? '(Host)' : ''}
                     </span>
                     <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${member.status === 'ready' ? 'text-green-500' : 'text-blue-500'}`}>
                       {member.status === 'ready' ? 'Pronto' : 'In gioco'}
                     </p>
                   </div>
                 </div>
               );
             })}
          </div>

          <footer>
            <HapticButton 
              onClick={startSession}
              className="group w-full py-6 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 dark:from-red-500 dark:via-purple-600 dark:to-indigo-700 text-white rounded-[32px] font-black text-xl italic uppercase tracking-widest shadow-2xl shadow-purple-600/30 dark:shadow-purple-500/30 active:scale-[0.96] transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="flex items-center justify-center gap-3 relative z-10">
                <Play fill="currentColor" size={24} className="animate-pulse" />
                Inizia Match
              </div>
            </HapticButton>
          </footer>
        </div>
      )}
    </div>
  );
};
