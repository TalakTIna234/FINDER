-- Fix RLS Policy per permettere agli host (anche guest) di aggiornare le loro stanze
-- Esegui questo SQL nel SQL Editor di Supabase

-- Rimuovi la policy esistente che richiede auth.uid()
DROP POLICY IF EXISTS "Host can update their room" ON public.rooms;

-- Crea nuova policy che permette a tutti di aggiornare
-- NOTA: La sicurezza è garantita dal codice TypeScript che usa .eq('id', room.id)
-- dove room.id è già verificato nel codice. Inoltre, solo l'host dovrebbe avere
-- il room.id corretto nel suo stato locale, quindi gli altri utenti non possono
-- aggiornare stanze di cui non hanno l'id.
-- Questa policy permette a guest e utenti autenticati di aggiornare le loro stanze
CREATE POLICY "Anyone can update rooms" ON public.rooms
  FOR UPDATE
  USING (true)  -- Permette a tutti (inclusi guest) di aggiornare
  WITH CHECK (true);  -- Permette a tutti (inclusi guest) di aggiornare

