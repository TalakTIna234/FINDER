-- Migration: Aggiungi 'lobby' come status valido per room_members
-- Esegui questo SQL nel SQL Editor di Supabase per supportare lo status 'lobby'

-- Rimuovi il constraint esistente
ALTER TABLE public.room_members 
  DROP CONSTRAINT IF EXISTS room_members_status_check;

-- Aggiungi il nuovo constraint che include 'lobby'
ALTER TABLE public.room_members
  ADD CONSTRAINT room_members_status_check 
  CHECK (status IN ('lobby', 'ready', 'playing'));

-- Opzionale: Aggiorna il default per nuovi membri a 'lobby'
ALTER TABLE public.room_members
  ALTER COLUMN status SET DEFAULT 'lobby';

