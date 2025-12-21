
// Servizio per playlist (film salvati)
import { supabase } from './supabaseClient';
import { Movie } from '../types';

export const playlistService = {
  // Ottieni playlist utente
  async getPlaylist(): Promise<Movie[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('playlists')
      .select('movie_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlist:', error);
      return [];
    }

    return data.map(item => item.movie_data as Movie);
  },

  // Aggiungi film alla playlist
  async addMovie(movie: Movie): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        movie_id: movie.id,
        movie_data: movie
      });

    if (error) {
      // Se il film esiste già, ignora l'errore
      if (error.code === '23505') {
        return true; // Già presente
      }
      console.error('Error adding movie to playlist:', error);
      return false;
    }

    // Incrementa contatore statistiche
    const { statsService } = await import('./statsService');
    await statsService.increment('movies_liked');

    return true;
  },

  // Rimuovi film dalla playlist
  async removeMovie(movieId: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Error removing movie from playlist:', error);
      return false;
    }

    return true;
  },

  // Verifica se un film è nella playlist
  async isInPlaylist(movieId: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('playlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single();

    return data !== null;
  },

  // Sincronizza playlist locale con database
  async syncPlaylist(localMovies: Movie[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Ottieni playlist dal database
    const dbPlaylist = await this.getPlaylist();
    const dbMovieIds = new Set(dbPlaylist.map(m => m.id));

    // Aggiungi film locali che non sono nel database
    const moviesToAdd = localMovies.filter(m => !dbMovieIds.has(m.id));
    
    for (const movie of moviesToAdd) {
      await this.addMovie(movie);
    }

    return true;
  }
};

