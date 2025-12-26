import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { PlayCircle, Check, X, Users } from 'lucide-react';

interface TrailerVoteProps {
  movie: Movie;
  trailerKey: string;
  requestedBy: string;
  totalMembers: number;
  currentVotes: number;
  onVote: (vote: 'yes' | 'no') => void;
  onClose: () => void;
  hasVoted: boolean;
  userVote?: 'yes' | 'no';
}

export const TrailerVote: React.FC<TrailerVoteProps> = ({ 
  movie, 
  trailerKey, 
  requestedBy,
  totalMembers,
  currentVotes,
  onVote,
  onClose,
  hasVoted,
  userVote
}) => {
  const requiredVotes = Math.ceil(totalMembers / 2);
  const isApproved = currentVotes >= requiredVotes;
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (isApproved) {
      // Mostra trailer dopo 1 secondo se approvato
      const timer = setTimeout(() => {
        setShowTrailer(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isApproved]);

  if (showTrailer) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black mx-4">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&showinfo=0&autohide=1&controls=1&modestbranding=1`}
            title={`Trailer ${movie.title}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#1C1C1E] rounded-[32px] p-6 border border-white/20 shadow-2xl"
      >
        {/* Movie preview */}
        <div className="mb-6">
          <div className="relative rounded-[24px] overflow-hidden mb-4">
            <img 
              src={movie.poster} 
              alt={movie.title}
              className="w-full h-[300px] object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(movie.title)}`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-2xl font-black text-white leading-tight mb-1">{movie.title}</h2>
              <div className="flex items-center gap-2">
                <p className="text-white/60 font-bold text-sm">{movie.year}</p>
                <div className="bg-yellow-400/90 backdrop-blur px-2 py-0.5 rounded-lg text-black font-black text-[10px]">★ {movie.rating}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vote info */}
        <div className="mb-6 text-center">
          <p className="text-white/60 font-bold text-sm mb-2">
            <span className="text-white">{requestedBy}</span> vuole guardare il trailer
          </p>
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs mb-4">
            <Users size={14} />
            <span>{currentVotes}/{requiredVotes} voti necessari</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentVotes / requiredVotes) * 100}%` }}
              className="h-full bg-gradient-to-r from-red-600 to-purple-600 rounded-full"
            />
          </div>

          {isApproved && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-500 font-black uppercase tracking-widest text-xs"
            >
              ✓ Approvato! Trailer in arrivo...
            </motion.p>
          )}
        </div>

        {/* Vote buttons */}
        {!hasVoted && !isApproved && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVote('yes')}
              className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <Check size={20} /> Sì
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVote('no')}
              className="flex-1 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <X size={20} /> No
            </motion.button>
          </div>
        )}

        {hasVoted && !isApproved && (
          <div className="text-center py-4">
            <p className="text-white/40 font-bold text-xs uppercase tracking-widest">
              Hai già votato: {userVote === 'yes' ? '✓ Sì' : '✗ No'}
            </p>
            <p className="text-white/30 text-[10px] mt-2">In attesa degli altri giocatori...</p>
          </div>
        )}

        {isApproved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white/60 font-bold text-xs">Caricamento trailer...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

