import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { PlayCircle, X } from 'lucide-react';

interface SupertrailerProps {
  movie: Movie;
  trailerKey: string;
  onClose: () => void;
}

export const Supertrailer: React.FC<SupertrailerProps> = ({ movie, trailerKey, onClose }) => {
  const [countdown, setCountdown] = useState(3);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowTrailer(true);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center">
      <AnimatePresence mode="wait">
        {!showTrailer ? (
          // Countdown screen
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="w-full max-w-md px-6 text-center"
          >
            {/* Movie card preview */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="relative rounded-[32px] overflow-hidden bg-[#1C1C1E] border border-white/20 shadow-2xl">
                <img 
                  src={movie.poster} 
                  alt={movie.title}
                  className="w-full h-[400px] object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(movie.title)}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-3xl font-black text-white leading-tight mb-2">{movie.title}</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-white/60 font-bold">{movie.year}</p>
                    <div className="bg-yellow-400/90 backdrop-blur px-2 py-0.5 rounded-lg text-black font-black text-xs">★ {movie.rating}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Countdown */}
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="mb-4"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center shadow-2xl"
                >
                  <span className="text-6xl font-black text-white">{countdown}</span>
                </motion.div>
                {countdown === 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.5, 1] }}
                    className="absolute inset-0 rounded-full bg-white/20"
                  />
                )}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 font-bold uppercase tracking-widest text-xs"
            >
              Trailer in arrivo...
            </motion.p>
          </motion.div>
        ) : (
          // Trailer screen
          <motion.div
            key="trailer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Trailer iframe */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&showinfo=0&autohide=1&controls=1&modestbranding=1`}
                  title={`Trailer ${movie.title}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

