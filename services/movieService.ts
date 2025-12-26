
import { Movie } from "../types";
import { MOCK_MOVIES, GENRES } from "../constants";

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN || "";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Supporta sia Bearer Token che API Key
// API Key è tipicamente < 50 caratteri, Bearer Token è molto più lungo
const isApiKey = TMDB_ACCESS_TOKEN && TMDB_ACCESS_TOKEN.length < 50;
const headers = isApiKey 
  ? { accept: 'application/json' }
  : { accept: 'application/json', Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` };
const apiKeyParam = isApiKey ? `&api_key=${TMDB_ACCESS_TOKEN}` : '';

export const movieService = {
  async discoverByGenre(genreId: number): Promise<Movie[]> {
    try {
      // Verifica che il token sia presente
      if (!TMDB_ACCESS_TOKEN) {
        console.error('TMDB_ACCESS_TOKEN is missing!');
        throw new Error('Token TMDB non configurato. Verifica le variabili d\'ambiente.');
      }
      
      // Genera una pagina random tra 1 e 20 (TMDB ha molte pagine)
      const randomPage = Math.floor(Math.random() * 20) + 1;
      
      // Aggiungi anche un parametro per randomizzare l'ordine
      const sortOptions = [
        'popularity.desc',
        'vote_average.desc',
        'release_date.desc',
        'revenue.desc',
        'vote_count.desc'
      ];
      const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
      
      const url = `${BASE_URL}/discover/movie?with_genres=${genreId}&language=it-IT&sort_by=${randomSort}&page=${randomPage}&include_adult=false${apiKeyParam}`;
      console.log(`Fetching movies for genre ${genreId}, page ${randomPage}, sort: ${randomSort}`);
      console.log('TMDB URL:', url.replace(TMDB_ACCESS_TOKEN, '***'));
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TMDB API Error (${response.status}):`, errorText);
        throw new Error(`Errore TMDB API: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.warn('TMDB returned empty results');
        throw new Error('Nessun film trovato per questo genere. Prova con un altro genere.');
      }
      
      console.log(`TMDB returned ${data.results.length} movies`);
      
      // Mescola i risultati per avere ancora più varietà
      const shuffled = [...data.results].sort(() => Math.random() - 0.5);
      
      const movies = shuffled.slice(0, 15).map((m: any) => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.split('-')[0] || "2024",
        poster: m.poster_path 
          ? `${IMAGE_BASE_URL}${m.poster_path}`
          : `https://placehold.co/500x750/1c1c1e/white?text=${encodeURIComponent(m.title)}`,
        rating: Math.round(m.vote_average * 10) / 10,
        genres: m.genre_ids.map((id: number) => GENRES.find(g => g.id === id)?.name || "Film"), 
        overview: m.overview || "Nessuna trama disponibile."
      }));
      
      console.log(`Successfully mapped ${movies.length} movies`);
      return movies;
    } catch (e) {
      console.error("TMDb Discover failed", e);
      // Non ritornare MOCK_MOVIES, rilancia l'errore
      throw e;
    }
  },

  async searchMovies(query: string): Promise<Movie[]> {
    if (!query) return [];
    try {
      const response = await fetch(
        `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=it-IT&page=1&include_adult=false${apiKeyParam}`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return data.results.slice(0, 8).map((m: any) => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.split('-')[0] || "N/A",
        poster: m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : "https://placehold.co/500x750/1c1c1e/white?text=No+Poster",
        rating: Math.round(m.vote_average * 10) / 10,
        genres: m.genre_ids.map((id: number) => GENRES.find(g => g.id === id)?.name || "Altro"),
        overview: m.overview || "Nessuna trama disponibile."
      }));
    } catch (e) {
      console.error("TMDb Search failed", e);
      return [];
    }
  },

  async getMovieDetails(movieId: number): Promise<Partial<Movie>> {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/${movieId}?language=it-IT&append_to_response=videos${apiKeyParam}`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      // Priorità al trailer italiano
      const video = data.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube" && v.iso_639_1 === "it") 
                 || data.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      
      return {
        overview: data.overview,
        genres: data.genres.map((g: any) => g.name),
        trailerKey: video?.key
      };
    } catch (e) {
      return {};
    }
  }
};
