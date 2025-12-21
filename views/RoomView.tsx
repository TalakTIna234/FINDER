
import React, { useState, useEffect } from 'react';
import { HapticButton } from '../components/HapticButton';
import { ChevronLeft, Share, Play, Users, Search, List, Wand2, Sparkles } from 'lucide-react';
import { GENRES } from '../constants';
import { Movie } from '../types';
import { movieService } from '../services/movieService';
import { roomService, Room } from '../services/roomService';
import { authService } from '../services/authService';
import { statsService } from '../services/statsService';
import { useState as useRoomState, useEffect as useRoomEffect } from 'react';

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
    try {
      console.log('Starting genre selection:', genreId);
      
      // Carica film
      console.log('Loading movies...');
      const movies = await movieService.discoverByGenre(genreId);
      console.log('Movies loaded:', movies?.length || 0);
      
      if (!movies || movies.length === 0) {
        alert('Nessun film trovato per questo genere. Riprova.');
        setLoading(false);
        return;
      }
      
      // Verifica autenticazione
      console.log('Checking authentication...');
      const user = await authService.getCurrentUser();
      if (!user) {
        console.error('User not authenticated');
        alert('Devi essere autenticato per creare una stanza. Effettua il login.');
        setLoading(false);
        return;
      }
      console.log('User authenticated:', user.id);
      
      // Crea stanza
      console.log('Creating room...');
      const newRoom = await roomService.createRoom(user.id, user.nickname, movies);
      
      if (!newRoom) {
        console.error('Failed to create room');
        alert('Errore nella creazione della stanza. Verifica che le tabelle rooms e room_members siano state create in Supabase. Controlla la console per dettagli.');
        setLoading(false);
        return;
      }
      
      console.log('Room created successfully:', newRoom.code);
      setRoomCode(newRoom.code);
      setRoom(newRoom);
      
      // Incrementa statistiche (non bloccante)
      try {
        await statsService.increment('rooms_created');
      } catch (statsError) {
        console.warn('Error incrementing stats (non-critical):', statsError);
      }
      
      setStep('lobby');
      setLoading(false);
    } catch (error) {
      console.error('Error in handleSelectGenre:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Errore nel caricamento dei film: ' + (error instanceof Error ? error.message : 'Errore sconosciuto') + '. Controlla la console per dettagli.');
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
            onClick={() => setStep('manual')}
            className="p-8 bg-gray-950 rounded-[40px] border border-white/5 flex items-center gap-6 opacity-40 grayscale pointer-events-none"
           >
              <div className="p-5 bg-white/5 rounded-3xl text-white/50"><List size={32}/></div>
              <div className="text-left">
                <h3 className="text-xl font-black italic uppercase tracking-tight">Manuale</h3>
                <p className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-widest">Prossimamente</p>
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
                
                // Verifica autenticazione
                console.log('Checking authentication...');
                const user = await authService.getCurrentUser();
                if (!user) {
                  console.error('User not authenticated');
                  alert('Devi essere autenticato per entrare in una stanza. Effettua il login.');
                  setLoading(false);
                  return;
                }
                console.log('User authenticated:', user.id);
                
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
                setStep('lobby');
                
                // Incrementa statistiche (non bloccante)
                try {
                  await statsService.increment('rooms_joined');
                } catch (statsError) {
                  console.warn('Error incrementing stats (non-critical):', statsError);
                }
                
                setLoading(false);
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
