
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Movie } from '../types';
import { X, Heart, Star, PlayCircle, Info, ChevronDown, Trophy, CheckCircle2, Sparkles } from 'lucide-react';
import { HapticButton } from './HapticButton';
import { movieService } from '../services/movieService';
import { statsService } from '../services/statsService';
import { Supertrailer } from './Supertrailer';
import { TrailerVote } from './TrailerVote';
import confetti from 'canvas-confetti';

interface CardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isFront: boolean;
  onShowDetails: () => void;
  onRequestTrailer?: (movie: Movie, trailerKey: string) => void;
}

const MovieCard: React.FC<CardProps> = ({ movie, onSwipe, isFront, onShowDetails, onRequestTrailer }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const passOpacity = useTransform(x, [-150, -50], [1, 0]);
  const [movieDetails, setMovieDetails] = useState<Partial<Movie> | null>(null);

  // Carica dettagli quando la card è frontale
  useEffect(() => {
    if (isFront && !movieDetails) {
      movieService.getMovieDetails(movie.id).then(details => {
        setMovieDetails(details);
      });
    }
  }, [isFront, movie.id]);

  return (
    <motion.div
      style={{ x, y, rotate, opacity, zIndex: isFront ? 10 : 0 }}
      drag={isFront && !isPaused}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onSwipe('right');
        else if (info.offset.x < -120) onSwipe('left');
        else if (info.offset.y < -120) onSwipe('up');
      }}
      onClick={() => isFront && onShowDetails()}
      className="absolute w-full h-[65vh] max-w-sm rounded-[48px] overflow-hidden bg-[#1C1C1E] ios-card-shadow border border-white/10 cursor-grab active:cursor-grabbing group"
    >
      <img 
        src={movie.poster} 
        alt={movie.title} 
        className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(movie.title)}`;
        }}
      />
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 left-12 border-8 border-green-500 rounded-2xl px-6 py-3 rotate-[-15deg] pointer-events-none z-20 bg-green-500/10 backdrop-blur-sm">
        <span className="text-green-500 font-black text-5xl uppercase tracking-tighter">SI</span>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="absolute top-12 right-12 border-8 border-red-500 rounded-2xl px-6 py-3 rotate-[15deg] pointer-events-none z-20 bg-red-500/10 backdrop-blur-sm">
        <span className="text-red-500 font-black text-5xl uppercase tracking-tighter">NO</span>
      </motion.div>
      
      {/* Overlay con trama e trailer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent dark:from-white dark:via-white/95 pt-24 transition-colors duration-500">
        <h2 className="text-3xl font-black text-white dark:text-black leading-tight mb-2 transition-colors duration-500">{movie.title}</h2>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-white/60 dark:text-black/60 font-bold transition-colors duration-500">{movie.year}</p>
          <div className="bg-yellow-400/90 backdrop-blur px-2 py-0.5 rounded-lg text-black font-black text-[10px]">★ {movie.rating}</div>
        </div>
        
        {/* Trama - sempre visibile ma compatta */}
        {(movie.overview || movieDetails?.overview) && (
          <div className="mb-3">
            <p className="text-white/80 dark:text-black/80 text-xs font-medium leading-relaxed line-clamp-2 transition-colors duration-500">
              {movieDetails?.overview || movie.overview}
            </p>
          </div>
        )}
        
        {/* Pulsante trailer se disponibile */}
        {movieDetails?.trailerKey && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onRequestTrailer) {
                onRequestTrailer(movie, movieDetails.trailerKey!);
              } else {
                onShowDetails();
              }
            }}
            className="w-full py-2.5 bg-red-600/90 dark:bg-red-500/90 hover:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all duration-300 backdrop-blur-sm"
          >
            <PlayCircle size={16} /> Guarda Trailer
          </button>
        )}
      </div>
    </motion.div>
  );
};

interface CardStackProps {
  movies: Movie[];
  onFinish: (finalMovies: Movie[]) => void;
  isMultiplayer?: boolean;
  userId?: string;
  userNickname?: string;
  totalMembers?: number;
}

export const CardStack: React.FC<CardStackProps> = ({ 
  movies, 
  onFinish, 
  isMultiplayer = false,
  userId,
  userNickname = 'Tu',
  totalMembers = 1
}) => {
  const [currentRoundMovies, setCurrentRoundMovies] = useState<Movie[]>(movies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedThisRound, setLikedThisRound] = useState<Movie[]>([]);
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState<Movie | null>(null);
  const [isInstantMatch, setIsInstantMatch] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [detailedMovie, setDetailedMovie] = useState<Movie | null>(null);
  const [showTrailerInApp, setShowTrailerInApp] = useState(false);
  
  // Sistema trailer
  const [trailersUsed, setTrailersUsed] = useState<number>(0);
  const [supertrailerMovie, setSupertrailerMovie] = useState<{ movie: Movie; trailerKey: string } | null>(null);
  const [voteTrailer, setVoteTrailer] = useState<{ movie: Movie; trailerKey: string; requestedBy: string; votes: { userId: string; vote: 'yes' | 'no' }[] } | null>(null);
  const [userVote, setUserVote] = useState<'yes' | 'no' | undefined>(undefined);
  
  // Carica trailer usati da localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mm_trailers_used');
    if (saved) {
      setTrailersUsed(parseInt(saved, 10));
    }
  }, []);
  
  // Salva trailer usati in localStorage
  useEffect(() => {
    localStorage.setItem('mm_trailers_used', trailersUsed.toString());
  }, [trailersUsed]);
  
  // Reset trailer quando inizia nuova sessione
  useEffect(() => {
    setTrailersUsed(0);
    localStorage.removeItem('mm_trailers_used');
  }, [movies]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#FF3B30', '#FFD700', '#007AFF', '#30D158']
    });
  };

  useEffect(() => {
    if (selectedMovie) {
      movieService.getMovieDetails(selectedMovie.id).then(details => {
        setDetailedMovie({ ...selectedMovie, ...details });
      });
    } else {
      setDetailedMovie(null);
      setShowTrailerInApp(false);
    }
  }, [selectedMovie]);

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const movie = currentRoundMovies[currentIndex];
    let nextLiked = [...likedThisRound];
    
    if (direction === 'right' || direction === 'up') {
      nextLiked.push(movie);
      setLikedThisRound(nextLiked);
      
      // Animazione Match ad ogni Like (richiesta dall'utente)
      setIsInstantMatch(true);
      triggerConfetti();
      setTimeout(() => setIsInstantMatch(false), 1500);
    }

    if (currentIndex < currentRoundMovies.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (nextLiked.length === 0) {
        setCurrentIndex(0);
        setLikedThisRound([]);
      } else if (nextLiked.length === 1) {
        setWinner(nextLiked[0]);
        triggerConfetti();
        // Incrementa statistiche match
        statsService.increment('matches_found');
      } else {
        setCurrentRoundMovies(nextLiked);
        setLikedThisRound([]);
        setCurrentIndex(0);
        setRound(prev => prev + 1);
      }
    }
  };

  if (winner) {
    return (
      <div className="fixed inset-0 bg-black dark:bg-white flex flex-col items-center overflow-hidden pb-12 pt-16 px-6 transition-colors duration-500">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-yellow-500/40">
            <Trophy size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white dark:text-black leading-none transition-colors duration-500">Match Finale!</h1>
          <p className="text-white/40 dark:text-black/60 font-bold uppercase tracking-widest text-[9px] mt-1 transition-opacity duration-500">Stasera si guarda questo capolavoro</p>
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="flex-1 w-full max-w-sm flex flex-col min-h-0 bg-[#1C1C1E] dark:bg-gray-100 rounded-[48px] overflow-hidden border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500"
        >
          <div className="relative flex-1 overflow-hidden">
             <img 
               src={winner.poster} 
               className="w-full h-full object-cover"
               onError={(e) => {
                 e.currentTarget.src = `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(winner.title)}`;
               }}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl font-black text-white leading-tight mb-1">{winner.title}</h2>
                <p className="text-white/50 font-bold">{winner.year}</p>
             </div>
          </div>
        </motion.div>

        <div className="w-full max-w-sm mt-8">
          <HapticButton 
            onClick={() => onFinish([winner])}
            className="w-full py-5 bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 dark:from-red-500 dark:via-purple-500 dark:to-indigo-500 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
          >
            <CheckCircle2 size={24} /> Chiudi Sessione
          </HapticButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black dark:bg-white overflow-hidden transition-colors duration-500">
      <header className="absolute top-16 z-50 flex flex-col items-center gap-1">
        <div className="bg-white/10 dark:bg-black/10 ios-blur px-5 py-1.5 rounded-full border border-white/10 dark:border-black/20 transition-colors duration-500">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 dark:text-black/90">Round {round} • Eliminazione</span>
        </div>
        <p className="text-[9px] text-white/20 dark:text-black/30 font-black uppercase tracking-widest transition-opacity duration-500">
           Film {currentIndex + 1} di {currentRoundMovies.length}
        </p>
      </header>

      <div className="relative w-full h-[65vh] flex justify-center perspective-[1000px]">
        <AnimatePresence mode="popLayout">
          {currentRoundMovies.slice(currentIndex, currentIndex + 2).reverse().map((movie, idx) => (
            <MovieCard 
              key={`${round}-${movie.id}`} 
              movie={movie} 
              onSwipe={handleSwipe} 
              onShowDetails={() => !isPaused && setSelectedMovie(movie)}
              onRequestTrailer={isMultiplayer ? (movie, trailerKey) => {
                handleRequestTrailer(movie, trailerKey);
              } : undefined}
              isFront={idx === 1 || currentRoundMovies.length - currentIndex === 1} 
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-8 mt-12 mb-10 z-[50]">
        <HapticButton 
          impact="heavy"
          onClick={() => handleSwipe('left')}
          disabled={isPaused}
          className="w-16 h-16 rounded-full bg-white/5 dark:bg-black/10 border border-white/10 dark:border-black/20 flex items-center justify-center text-red-500 dark:text-red-600 shadow-xl active:bg-red-500/10 dark:active:bg-red-600/20 transition-colors duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <X size={32} strokeWidth={3} />
        </HapticButton>

        <HapticButton 
          impact="heavy"
          onClick={() => handleSwipe('up')}
          disabled={isPaused}
          className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xl scale-125 ring-4 ring-black dark:ring-white transition-colors duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Star size={32} fill="currentColor" strokeWidth={0} />
        </HapticButton>

        <HapticButton 
          impact="heavy"
          onClick={() => handleSwipe('right')}
          disabled={isPaused}
          className="w-16 h-16 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white shadow-xl active:bg-green-400 dark:active:bg-green-500 transition-colors duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Heart size={32} fill="currentColor" strokeWidth={0} />
        </HapticButton>
      </div>

      {/* Supertrailer Overlay */}
      {supertrailerMovie && (
        <Supertrailer
          movie={supertrailerMovie.movie}
          trailerKey={supertrailerMovie.trailerKey}
          onClose={handleTrailerClose}
        />
      )}
      
      {/* Trailer Vote Overlay */}
      {voteTrailer && (
        <TrailerVote
          movie={voteTrailer.movie}
          trailerKey={voteTrailer.trailerKey}
          requestedBy={voteTrailer.requestedBy}
          totalMembers={totalMembers}
          currentVotes={voteTrailer.votes.filter(v => v.vote === 'yes').length}
          onVote={handleVote}
          onClose={handleVoteTrailerEnd}
          hasVoted={userVote !== undefined}
          userVote={userVote}
        />
      )}
      
      {/* Instant Match Animation Overlay */}
      <AnimatePresence>
        {isInstantMatch && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[150] flex flex-col items-center justify-center pointer-events-none"
          >
             <div className="p-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-[50px] shadow-2xl border-4 border-white/30 transform -rotate-6">
                <Sparkles className="absolute -top-6 -right-6 text-yellow-300 animate-pulse" size={50} />
                <h2 className="text-6xl font-black italic tracking-tighter text-white dark:text-black uppercase mb-1 transition-colors duration-500">MATCH!</h2>
                <p className="text-white dark:text-black font-black text-center uppercase tracking-widest text-[10px] opacity-80 dark:opacity-90 transition-opacity duration-500">Ottima scelta!</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMovie && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-black dark:bg-white overflow-y-auto transition-colors duration-500"
          >
            {!showTrailerInApp ? (
              <div className="pb-12">
                <div className="relative h-[55vh]">
                  <img 
                    src={selectedMovie.poster} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(selectedMovie.title)}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent dark:from-white dark:via-white/40 transition-colors duration-500" />
                  <HapticButton 
                    onClick={() => setSelectedMovie(null)}
                    className="absolute top-12 right-6 p-2 bg-black/40 dark:bg-white/40 rounded-full text-white dark:text-black transition-colors duration-500"
                  >
                    <ChevronDown size={32} />
                  </HapticButton>
                </div>
                
                <div className="p-8 space-y-6 -mt-20 relative z-10">
                  <div className="flex justify-between items-end">
                    <div className="flex-1 pr-4">
                      <h2 className="text-4xl font-black leading-tight italic tracking-tighter uppercase">{selectedMovie.title}</h2>
                      <p className="text-xl opacity-60 font-bold">{selectedMovie.year}</p>
                    </div>
                    <div className="bg-yellow-400 px-4 py-1 rounded-full text-black font-black text-lg shadow-lg">★ {selectedMovie.rating}</div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {detailedMovie?.genres?.map(g => (
                      <span key={g} className="px-3 py-1 bg-white/10 dark:bg-black/10 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] text-white/70 dark:text-black/70 transition-colors duration-500">{g}</span>
                    ))}
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 dark:opacity-60 text-white dark:text-black transition-opacity duration-500">Trama</h3>
                     <p className="text-white/70 dark:text-black/70 leading-relaxed font-medium text-sm transition-colors duration-500">
                       {detailedMovie?.overview || selectedMovie.overview}
                     </p>
                  </div>

                  {detailedMovie?.trailerKey && (
                    <HapticButton 
                      onClick={() => setShowTrailerInApp(true)}
                      className="w-full py-5 bg-red-600 dark:bg-red-500 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-red-600/30 dark:shadow-red-500/30 transition-colors duration-500"
                    >
                      <PlayCircle size={28} /> Guarda Trailer ITA
                    </HapticButton>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col bg-black dark:bg-white transition-colors duration-500">
                <div className="pt-16 pb-4 px-6 flex justify-between items-center bg-black dark:bg-white sticky top-0 z-50 border-b border-white/5 dark:border-black/10 transition-colors duration-500">
                   <h3 className="font-black italic uppercase text-[10px] tracking-widest truncate max-w-[60%] text-white/40 dark:text-black/60">{selectedMovie.title}</h3>
                   <HapticButton 
                    onClick={() => setShowTrailerInApp(false)}
                    className="text-red-500 dark:text-red-600 font-black uppercase text-[10px] tracking-widest px-5 py-2.5 bg-white/5 dark:bg-black/10 rounded-full border border-white/10 dark:border-black/20 transition-colors duration-500"
                   >
                     CHIUDI
                   </HapticButton>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="w-full aspect-video rounded-[32px] overflow-hidden bg-[#1C1C1E] border border-white/10 shadow-2xl">
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${detailedMovie?.trailerKey}?autoplay=1&rel=0&showinfo=0&autohide=1`}
                      title="Trailer"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                <div className="pb-12 px-8">
                  <p className="text-[9px] text-center font-black uppercase tracking-widest opacity-20 italic">Se il video non carica, assicurati che il film sia disponibile.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
