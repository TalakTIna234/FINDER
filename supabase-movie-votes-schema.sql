-- Tabella per i voti dei film in multiplayer
-- Esegui questo SQL nel SQL Editor di Supabase

-- Tabella movie_votes per tracciare i voti di ogni player per ogni film
CREATE TABLE IF NOT EXISTS public.movie_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  movie_id INTEGER NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('like', 'dislike')),
  round_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id, movie_id, round_number)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_movie_votes_room_id ON public.movie_votes(room_id);
CREATE INDEX IF NOT EXISTS idx_movie_votes_movie_id ON public.movie_votes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_votes_round ON public.movie_votes(room_id, round_number);

-- RLS Policies per movie_votes
ALTER TABLE public.movie_votes ENABLE ROW LEVEL SECURITY;

-- Chiunque può leggere i voti delle stanze (per sincronizzazione)
CREATE POLICY "Anyone can read movie votes" ON public.movie_votes
  FOR SELECT
  USING (true);

-- Chiunque può inserire voti (per guest e utenti autenticati)
CREATE POLICY "Anyone can insert movie votes" ON public.movie_votes
  FOR INSERT
  WITH CHECK (true);

-- Gli utenti possono aggiornare solo i propri voti
CREATE POLICY "Users can update own votes" ON public.movie_votes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

