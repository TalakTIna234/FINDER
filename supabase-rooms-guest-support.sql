-- Script per permettere ai guest di creare stanze
-- Esegui questo SQL nel SQL Editor di Supabase dopo aver eseguito supabase-rooms-schema.sql

-- Rimuovi il constraint FOREIGN KEY da host_id per permettere guest
ALTER TABLE public.rooms 
  DROP CONSTRAINT IF EXISTS rooms_host_id_fkey;

-- Rimuovi anche il constraint da user_id in room_members
ALTER TABLE public.room_members 
  DROP CONSTRAINT IF EXISTS room_members_user_id_fkey;

-- Aggiungi indici manuali per performance (senza foreign key)
CREATE INDEX IF NOT EXISTS idx_rooms_host_id_manual ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id_manual ON public.room_members(user_id);

-- Aggiorna le policy RLS per permettere a tutti di creare stanze (anche guest)
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Anyone can create rooms" ON public.rooms
  FOR INSERT
  WITH CHECK (true);

-- Aggiorna le policy per permettere a tutti di unirsi alle stanze
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_members;
CREATE POLICY "Anyone can join rooms" ON public.room_members
  FOR INSERT
  WITH CHECK (true);


