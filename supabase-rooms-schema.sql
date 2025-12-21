-- Tabella rooms per sistema multiplayer
-- Esegui questo SQL nel SQL Editor di Supabase

-- Tabella rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  host_nickname TEXT NOT NULL,
  movies JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella room_members
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'playing')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);

-- RLS Policies per rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Chiunque può leggere le stanze (per permettere join con codice)
CREATE POLICY "Anyone can read rooms" ON public.rooms
  FOR SELECT
  USING (true);

-- Solo gli utenti autenticati possono creare stanze
CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo l'host può aggiornare la sua stanza
CREATE POLICY "Host can update their room" ON public.rooms
  FOR UPDATE
  USING (auth.uid() = host_id);

-- RLS Policies per room_members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Chiunque può leggere i membri delle stanze
CREATE POLICY "Anyone can read room members" ON public.room_members
  FOR SELECT
  USING (true);

-- Gli utenti autenticati possono unirsi alle stanze
CREATE POLICY "Authenticated users can join rooms" ON public.room_members
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Gli utenti possono aggiornare il proprio status
CREATE POLICY "Users can update their own status" ON public.room_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Gli utenti possono lasciare le stanze
CREATE POLICY "Users can leave rooms" ON public.room_members
  FOR DELETE
  USING (auth.uid() = user_id);

