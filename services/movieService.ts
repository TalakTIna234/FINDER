
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
      
      // Pagine da provare: prima alcune pagine popolari (1-5), poi random
      const pagesToTry = [
        1, 2, 3, // Pagine popolari
        Math.floor(Math.random() * 10) + 1, // Random 1-10
        Math.floor(Math.random() * 20) + 1  // Random 1-20
      ];
      
      let lastError: Error | null = null;
      
      // Prova fino a 5 pagine diverse
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          // Usa pagine specifiche per i primi tentativi, poi random
          const page = attempt < pagesToTry.length ? pagesToTry[attempt] : Math.floor(Math.random() * 20) + 1;
          const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
          
          const url = `${BASE_URL}/discover/movie?with_genres=${genreId}&language=it-IT&sort_by=${randomSort}&page=${page}&include_adult=false${apiKeyParam}`;
          console.log(`[TMDB] Attempt ${attempt + 1}/5: Genre ${validGenre.name} (ID: ${genreId}), Page ${page}, Sort: ${randomSort}`);
          console.log(`[TMDB] URL: ${url.replace(TMDB_ACCESS_TOKEN, '***')}`);
          
          // Crea un AbortController per timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.error(`[TMDB] Timeout after 15 seconds on attempt ${attempt + 1}`);
            controller.abort();
          }, 15000); // 15 secondi timeout
          
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
              
              // Se è un errore 429 (rate limit), aspetta un po' e riprova
              if (response.status === 429 && attempt < retries - 1) {
                console.log('Rate limit raggiunto, aspetto 2 secondi...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
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
            
            // Se è un abort (timeout), riprova
            if (fetchError.name === 'AbortError') {
              console.warn(`Timeout on attempt ${attempt + 1}, retrying...`);
              lastError = new Error('Timeout nella chiamata a TMDB. Riprova.');
              if (attempt < 4) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Aspetta 1 secondo
                continue;
              }
            }
            
            throw fetchError;
          }
          
        } catch (attemptError) {
          console.error(`[TMDB] Attempt ${attempt + 1} failed:`, attemptError);
          lastError = attemptError instanceof Error ? attemptError : new Error('Errore sconosciuto');
          
          // Se non è l'ultimo tentativo, riprova
          if (attempt < 4) {
            const waitTime = (attempt + 1) * 1000; // Backoff esponenziale: 1s, 2s, 3s, 4s
            console.log(`[TMDB] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
      }
      
      // Se arriviamo qui, tutti i tentativi sono falliti
      console.error(`[TMDB] All 5 attempts failed for genre ${genreId} (${validGenre.name})`);
      throw lastError || new Error(`Impossibile caricare i film per il genere "${validGenre.name}". Riprova più tardi o prova con un altro genere.`);
      
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
