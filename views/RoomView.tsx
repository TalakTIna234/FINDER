
import React, { useState, useEffect } from 'react';
import { HapticButton } from '../components/HapticButton';
import { ChevronLeft, Share, Play, Users, Search, List, Wand2, Sparkles, Check, X } from 'lucide-react';
import { GENRES } from '../constants';
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
    
    // Timeout di sicurezza - se passa più di 30 secondi, mostra errore
    const timeoutId = setTimeout(() => {
      if (!timeoutCleared) {
        console.error('Timeout: handleSelectGenre took more than 30 seconds');
        alert('Il caricamento sta impiegando troppo tempo. Controlla la console per dettagli. Verifica che:\n1. Il token TMDB sia configurato\n2. Le tabelle rooms e room_members siano state create in Supabase\n3. La connessione internet sia attiva');
        setLoading(false);
      }
    }, 30000);
    
    try {
      console.log('=== STARTING GENRE SELECTION ===');
      console.log('Genre ID:', genreId);
      console.log('Timestamp:', new Date().toISOString());
      
      // Carica film
      console.log('[1/4] Loading movies from TMDB...');
      console.log('TMDB Access Token present:', !!import.meta.env.VITE_TMDB_ACCESS_TOKEN);
      const moviesStartTime = Date.now();
      
      let movies: Movie[] = [];
      try {
        movies = await movieService.discoverByGenre(genreId);
      } catch (movieError) {
        clearTimeout(timeoutId);
        console.error('[1/4] Error loading movies:', movieError);
        const errorMsg = movieError instanceof Error ? movieError.message : 'Errore sconosciuto';
        alert(`Errore nel caricamento dei film: ${errorMsg}\n\nVerifica che:\n1. Il token TMDB sia configurato correttamente\n2. La connessione internet sia attiva\n3. Controlla la console per dettagli.`);
        setLoading(false);
        return;
      }
      
      const moviesLoadTime = Date.now() - moviesStartTime;
      console.log(`[1/4] Movies loaded in ${moviesLoadTime}ms:`, movies?.length || 0);
      console.log('[1/4] Sample movie:', movies[0]);
      
      if (!movies || movies.length === 0) {
        clearTimeout(timeoutId);
        console.error('[1/4] No movies returned from TMDB');
        alert('Nessun film trovato per questo genere. Verifica:\n1. Il token TMDB sia valido\n2. La connessione internet sia attiva\n3. Riprova con un altro genere.');
        setLoading(false);
        return;
      }
      
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
      
      // Incrementa statistiche (non bloccante)
      try {
        await statsService.increment('rooms_created');
        console.log('Stats incremented');
      } catch (statsError) {
        console.warn('Error incrementing stats (non-critical):', statsError);
      }
      
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
      <div className="h-full flex flex-col items-center justify-center space-y-8 bg-black">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <Sparkles size={24} className="text-red-500" />
            </div>
        </div>
        <p className="font-black text-xs uppercase tracking-[0.4em] opacity-30">Discovery in corso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6 pt-16 bg-black text-white">
      <header className="flex items-center gap-4 mb-10">
        <HapticButton onClick={onBack} className="p-3 bg-white/5 rounded-full border border-white/10 active:bg-white/10">
          <ChevronLeft />
        </HapticButton>
        <h1 className="text-2xl font-black italic tracking-tight uppercase">
          {step === 'lobby' ? 'Lobby Stanza' : step === 'code' ? 'Entra in Stanza' : 'Configurazione'}
        </h1>
      </header>

      {step === 'type' && (
        <div className="flex flex-col gap-5">
           <HapticButton 
            onClick={() => setStep('genre')}
            className="p-8 bg-[#1C1C1E] rounded-[40px] border border-white/10 flex items-center gap-6 active:scale-[0.97] transition-all"
           >
              <div className="p-5 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl text-white shadow-xl"><Wand2 size={32}/></div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-black italic uppercase tracking-tight">Per Genere</h3>
                <p className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-widest">Discovery rapida</p>
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
              <div className="p-5 bg-gradient-to-br from-blue-600 to-cyan-700 rounded-3xl text-white shadow-xl"><List size={32}/></div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-black italic uppercase tracking-tight">Manuale</h3>
                <p className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-widest">Cerca e seleziona</p>
              </div>
           </HapticButton>
        </div>
      )}

      {step === 'code' && (
        <div className="flex-1 flex flex-col justify-center space-y-8 pb-32">
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-4xl text-center tracking-[0.2em] focus:outline-none focus:border-red-600/50 transition-colors uppercase"
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
            className="w-full py-6 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white rounded-[32px] font-black text-xl italic uppercase tracking-widest shadow-2xl shadow-blue-600/30 active:scale-[0.96] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Caricamento...' : 'Entra in Stanza'}
          </HapticButton>
        </div>
      )}

      {step === 'genre' && (
        <div className="grid grid-cols-2 gap-4 pb-32 overflow-y-auto no-scrollbar">
          {GENRES.map(g => (
            <HapticButton 
              key={g.id}
              onClick={() => handleSelectGenre(g.id)}
              className="bg-[#1C1C1E] p-8 rounded-[40px] flex flex-col items-center gap-4 border border-white/5 ios-card-shadow active:scale-95 transition-all"
            >
              <span className="text-5xl drop-shadow-lg">{g.icon}</span>
              <span className="font-black uppercase italic text-xs tracking-[0.1em]">{g.name}</span>
            </HapticButton>
          ))}
        </div>
      )}

      {step === 'manual' && (
        <div className="flex-1 flex flex-col space-y-6 pb-32 overflow-y-auto">
          {/* Barra di ricerca con dropdown */}
          <div className="space-y-4 relative">
            <div className="relative">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca film... (ricerca automatica)"
                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] pl-14 pr-5 py-4 font-bold text-sm focus:outline-none focus:border-red-600/50 focus:bg-white/15 transition-all duration-300 text-white placeholder:text-white/30 shadow-lg"
              />
              {isSearching && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Dropdown risultati elegante */}
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-2xl rounded-[24px] border border-white/20 shadow-2xl z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-black opacity-40 uppercase tracking-widest">Ricerca in corso...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map(movie => (
                      <HapticButton
                        key={movie.id}
                        onClick={() => addMovieToManualList(movie)}
                        className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-[20px] flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all duration-200 group"
                      >
                        {movie.poster ? (
                          <img 
                            src={movie.poster} 
                            alt={movie.title} 
                            className="w-16 h-24 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                            <span className="text-xs font-black opacity-50">No Image</span>
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="font-black text-sm truncate mb-1">{movie.title}</h4>
                          <div className="flex items-center gap-3 text-[10px] opacity-70">
                            <span className="font-bold">{movie.year}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="font-bold">{movie.rating}/10</span>
                            </div>
                            {movie.genres && movie.genres.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="truncate">{movie.genres[0]}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check size={24} />
                        </div>
                      </HapticButton>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs font-black opacity-40 uppercase tracking-widest">Nessun risultato trovato</p>
                    <p className="text-[10px] font-black opacity-20 mt-2">Prova con un altro titolo</p>
                  </div>
                )}
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

          {/* Pulsante crea stanza */}
          <HapticButton
            onClick={handleCreateManualRoom}
            disabled={manualMovies.length === 0 || loading}
            className="w-full py-6 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 text-white rounded-[32px] font-black text-xl italic uppercase tracking-widest shadow-2xl shadow-purple-600/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96] transition-all"
          >
            {loading ? 'Creazione...' : `Crea Stanza (${manualMovies.length} film)`}
          </HapticButton>
        </div>
      )}

      {step === 'lobby' && (
        <div className="flex-1 flex flex-col space-y-10 pb-10">
          <div className="bg-[#1C1C1E] rounded-[48px] p-10 text-center space-y-6 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.5em] mb-3">Codice Accesso</p>
              <h2 className="text-6xl font-black text-red-600 font-mono tracking-[0.1em]">{roomCode}</h2>
            </div>
            <HapticButton 
              onClick={() => navigator.share?.({ title: 'MovieMatch', text: `Entra nella mia stanza: ${roomCode}` })}
              className="px-8 py-3 bg-white/5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto active:bg-white/10 transition-colors border border-white/5 relative z-10"
            >
              <Share size={14} /> Condividi Invito
            </HapticButton>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full -mr-16 -mt-16" />
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
              className="group w-full py-6 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 text-white rounded-[32px] font-black text-xl italic uppercase tracking-widest shadow-2xl shadow-purple-600/30 active:scale-[0.96] transition-all relative overflow-hidden"
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
