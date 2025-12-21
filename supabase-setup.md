# Setup Supabase per MovieMatch

## Passo 1: Crea Account e Progetto

1. Vai su https://supabase.com
2. Clicca "Start your project" o "Sign in"
3. Crea un account (puoi usare GitHub, Google, etc.)
4. Clicca "New Project"
5. Compila il form:
   - **Name**: `moviematch` (o quello che preferisci)
   - **Database Password**: scegli una password forte (SALVALA!)
   - **Region**: scegli la più vicina (es. "West Europe" per Italia)
   - **Pricing Plan**: Free (gratuito)
6. Clicca "Create new project"
7. Attendi 2-3 minuti per il setup

## Passo 2: Ottieni le API Keys

1. Nel dashboard Supabase, vai su **Settings** (icona ingranaggio in basso a sinistra)
2. Clicca su **API**
3. Trova:
   - **Project URL** (es: `https://xxxxx.supabase.co`)
   - **anon public** key (chiave lunga che inizia con `eyJ...`)
4. Copia entrambi i valori

## Passo 3: Configura Environment Variables

Aggiungi al file `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (la chiave anon public)
```

## Passo 4: Crea le Tabelle nel Database

Nel dashboard Supabase:
1. Vai su **SQL Editor** (icona database nella sidebar)
2. Clicca "New query"
3. Incolla questo SQL e clicca "Run":

```sql
-- Tabella users (estende auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella friends
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Tabella playlists
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Tabella user_stats
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  movies_liked INTEGER DEFAULT 0,
  matches_found INTEGER DEFAULT 0,
  rooms_created INTEGER DEFAULT 0,
  rooms_joined INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX idx_friends_status ON public.friends(status);
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_movie_id ON public.playlists(movie_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users possono leggere tutti i profili pubblici
CREATE POLICY "Users can read all profiles"
  ON public.users FOR SELECT
  USING (true);

-- Policy: Users possono aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users possono inserire solo il proprio profilo
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Friends - lettura
CREATE POLICY "Users can read own friendships"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Friends - inserimento
CREATE POLICY "Users can create friendships"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Friends - aggiornamento
CREATE POLICY "Users can update own friendships"
  ON public.friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Playlists - lettura
CREATE POLICY "Users can read own playlists"
  ON public.playlists FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Playlists - inserimento
CREATE POLICY "Users can insert own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Playlists - eliminazione
CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Stats - lettura
CREATE POLICY "Users can read own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Stats - inserimento/aggiornamento
CREATE POLICY "Users can manage own stats"
  ON public.user_stats FOR ALL
  USING (auth.uid() = user_id);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Passo 5: Abilita Storage per Avatar

1. Vai su **Storage** nella sidebar
2. Clicca "Create a new bucket"
3. Nome: `avatars`
4. **Public bucket**: Sì (spunta la checkbox)
5. Clicca "Create bucket"
6. Vai su **Policies** del bucket `avatars`
7. Clicca "New Policy" → "For full customization"
8. Nome: "Users can upload own avatar"
9. Policy:

```sql
-- Allow authenticated users to upload their own avatar
(bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

10. Clicca "Review" e "Save policy"

## Passo 6: Configura Autenticazione

1. Vai su **Authentication** → **Providers**
2. Abilita **Google** (opzionale, per login Google)
3. Abilita **Apple** (opzionale, per login Apple)
4. Per ora, useremo **Email** (già abilitato di default)

## Fine Setup!

Dopo aver completato questi passi, l'app sarà pronta per usare Supabase!

