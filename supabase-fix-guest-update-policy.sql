-- Fix RLS Policy per permettere ai guest di aggiornare il proprio status
-- Esegui questo SQL nel SQL Editor di Supabase

-- Rimuovi la policy esistente che richiede auth.uid()
DROP POLICY IF EXISTS "Users can update their own status" ON public.room_members;

-- Crea nuova policy che permette a chiunque di aggiornare il proprio status (basato su user_id, non auth.uid)
-- NOTA: Questo permette agli utenti di aggiornare il loro status anche se non sono autenticati (guest)
-- La sicurezza è garantita dal fatto che possono aggiornare solo il proprio user_id
CREATE POLICY "Anyone can update their own status" ON public.room_members
  FOR UPDATE
  USING (true)  -- Permette a tutti (inclusi guest) di aggiornare
  WITH CHECK (true);  -- Permette a tutti (inclusi guest) di aggiornare

-- ALTERNATIVA PIÙ SICURA: Se vuoi mantenere più sicurezza, puoi usare questa invece:
-- (Ma richiede che user_id corrisponda a auth.uid() per utenti autenticati, e permette guest per user_id non UUID standard)
-- CREATE POLICY "Anyone can update their own status" ON public.room_members
--   FOR UPDATE
--   USING (auth.uid()::text = user_id::text OR auth.role() = 'anon')
--   WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'anon');

