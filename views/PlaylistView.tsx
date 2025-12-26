
import React from 'react';
import { Movie } from '../types';
import { Trash2, Star, PlayCircle, Film } from 'lucide-react';
import { HapticButton } from '../components/HapticButton';

interface Props {
  likedMovies: Movie[];
  onRemove: (id: number) => void;
}

export const PlaylistView: React.FC<Props> = ({ likedMovies, onRemove }) => {
  // Raggruppa i film per genere
  const groupedMovies: Record<string, Movie[]> = likedMovies.reduce((acc, movie) => {
    const genre = movie.genres[0] || 'Altri';
    if (!acc[genre]) acc[genre] = [];
    acc[genre].push(movie);
    return acc;
  }, {} as Record<string, Movie[]>);

  const genres = Object.keys(groupedMovies).sort();

  return (
    <div className="flex flex-col h-full bg-black dark:bg-white p-6 pt-16 pb-32 space-y-8 overflow-y-auto no-scrollbar transition-colors duration-500">
      <header className="space-y-1">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white dark:text-black transition-colors duration-500">I Miei Match</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 dark:opacity-60 text-white dark:text-black transition-opacity duration-500">Collezione Personale v3.0</p>
      </header>

      {likedMovies.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-10 dark:opacity-20">
          <Film size={80} strokeWidth={1} className="text-white dark:text-black" />
          <p className="text-xl font-black uppercase italic tracking-tighter text-white dark:text-black">Inizia a swippare per<br/>popolare la lista</p>
        </div>
      ) : (
        <div className="space-y-12">
          {genres.map(genre => (
            <section key={genre} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2 text-white dark:text-black">
                  <span className="w-1 h-6 bg-red-600 dark:bg-red-500 rounded-full" />
                  {genre}
                </h2>
                <span className="text-[10px] font-black opacity-30 dark:opacity-60 uppercase tracking-widest text-white dark:text-black">{groupedMovies[genre].length} Film</span>
              </div>
              
              <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 snap-x">
                {groupedMovies[genre].map((movie) => (
                  <div key={movie.id} className="snap-start flex-shrink-0 w-44 space-y-3">
                    <div className="relative aspect-[2/3] rounded-[28px] overflow-hidden border border-white/5 dark:border-black/20 shadow-2xl group transition-colors duration-500">
                      <img 
                        src={movie.poster} 
                        className="w-full h-full object-cover" 
                        alt={movie.title}
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(movie.title)}`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <HapticButton 
                          onClick={() => onRemove(movie.id)}
                          className="p-3 bg-red-600 rounded-full text-white shadow-xl"
                        >
                          <Trash2 size={18} />
                        </HapticButton>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-yellow-500 text-black px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> {movie.rating}
                      </div>
                    </div>
                    <div className="px-1">
                      <h3 className="font-bold text-xs truncate uppercase tracking-tight text-white dark:text-black">{movie.title}</h3>
                      <p className="text-[10px] opacity-30 dark:opacity-60 font-bold text-white dark:text-black">{movie.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
