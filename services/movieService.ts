
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
  async discoverByGenre(genreId: number, retries: number = 3): Promise<Movie[]> {
    try {
      // Verifica che il token sia presente
      if (!TMDB_ACCESS_TOKEN) {
        console.error('TMDB_ACCESS_TOKEN is missing!');
        throw new Error('Token TMDB non configurato. Verifica le variabili d\'ambiente.');
      }
      
      // Verifica che il genreId sia valido
      const validGenre = GENRES.find(g => g.id === genreId);
      if (!validGenre) {
        throw new Error(`Genere con ID ${genreId} non trovato nella lista dei generi supportati.`);
      }
      
      console.log(`Fetching movies for genre: ${validGenre.name} (ID: ${genreId})`);
      
      // Prova più pagine se la prima è vuota
      const sortOptions = [
        'popularity.desc',
        'vote_average.desc',
        'release_date.desc',
        'revenue.desc',
        'vote_count.desc'
      ];
      
      // Pagine da provare: solo pagine popolari per velocità (max 2 tentativi)
      const pagesToTry = [1, 2]; // Solo prime 2 pagine popolari
      
      let lastError: Error | null = null;
      
      // Prova solo 2 pagine per velocità massima
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          // Usa pagine specifiche per i primi tentativi, poi random
          const page = attempt < pagesToTry.length ? pagesToTry[attempt] : Math.floor(Math.random() * 20) + 1;
          const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
          
          const url = `${BASE_URL}/discover/movie?with_genres=${genreId}&language=it-IT&sort_by=${randomSort}&page=${page}&include_adult=false${apiKeyParam}`;
          console.log(`[TMDB] Attempt ${attempt + 1}/2: Genre ${validGenre.name} (ID: ${genreId}), Page ${page}, Sort: ${randomSort}`);
          console.log(`[TMDB] URL: ${url.replace(TMDB_ACCESS_TOKEN, '***')}`);
          
          // Crea un AbortController per timeout - 5 secondi per dare tempo alla connessione
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.error(`[TMDB] Timeout after 5 seconds on attempt ${attempt + 1}`);
            controller.abort();
          }, 5000); // 5 secondi timeout per dare tempo alla connessione
          
          try {
            const response = await fetch(url, { 
              headers,
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`TMDB API Error (${response.status}):`, errorText);
              
              // Se è un errore 401/403, non riprovare
              if (response.status === 401 || response.status === 403) {
                throw new Error(`Errore autenticazione TMDB: Token non valido o scaduto. Verifica VITE_TMDB_ACCESS_TOKEN.`);
              }
              
              // Se è un errore 429 (rate limit), riprova immediatamente (no delay per velocità)
              if (response.status === 429 && attempt < 1) {
                console.log('Rate limit raggiunto, riprovo immediatamente...');
                continue; // Riprova immediatamente senza delay
              }
              
              throw new Error(`Errore TMDB API: ${response.status} - ${errorText.substring(0, 100)}`);
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
              console.warn(`[TMDB] Page ${page} returned empty results (total_pages: ${data.total_pages || 'unknown'}), trying next page...`);
              lastError = new Error('Nessun film trovato per questo genere.');
              continue; // Prova la prossima pagina
            }
            
            console.log(`[TMDB] ✓ Success! Returned ${data.results.length} movies from page ${page} (total_pages: ${data.total_pages || 'unknown'})`);
            
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
            
            console.log(`✓ Successfully mapped ${movies.length} movies`);
            return movies;
            
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            // Gestione errori di rete più dettagliata
            if (fetchError.name === 'AbortError') {
              console.warn(`[TMDB] Timeout on attempt ${attempt + 1}, retrying immediately...`);
              lastError = new Error('Timeout nella chiamata a TMDB. La connessione è lenta.');
              if (attempt < 1) {
                continue; // Riprova immediatamente senza delay
              }
            } else if (fetchError.message?.includes('Failed to fetch') || 
                       fetchError.message?.includes('NetworkError') ||
                       fetchError.message?.includes('Network request failed') ||
                       fetchError.name === 'TypeError') {
              console.warn(`[TMDB] Network error on attempt ${attempt + 1}:`, fetchError.message);
              lastError = new Error('Errore di connessione. Verifica la tua connessione internet.');
              if (attempt < 1) {
                continue; // Riprova immediatamente
              }
            } else {
              // Altri errori: rilancia
              throw fetchError;
            }
          }
          
        } catch (attemptError) {
          console.error(`[TMDB] Attempt ${attempt + 1} failed:`, attemptError);
          lastError = attemptError instanceof Error ? attemptError : new Error('Errore sconosciuto');
          
          // Se non è l'ultimo tentativo, riprova immediatamente (no delay per velocità)
          if (attempt < 1) {
            continue; // Riprova immediatamente senza delay
          }
        }
      }
      
      // Se arriviamo qui, tutti i tentativi sono falliti
      console.error(`[TMDB] All 2 attempts failed for genre ${genreId} (${validGenre.name})`);
      throw lastError || new Error(`Impossibile caricare i film per il genere "${validGenre.name}". Riprova.`);
      
    } catch (e) {
      console.error("TMDb Discover failed after all retries", e);
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
