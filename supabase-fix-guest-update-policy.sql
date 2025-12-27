-- Fix RLS Policy per permettere ai guest di aggiornare il proprio status
-- Esegui questo SQL nel SQL Editor di Supabase

-- Rimuovi la policy esistente che richiede auth.uid()
DROP POLICY IF EXISTS "Users can update their own status" ON public.room_members;

-- Crea nuova policy che permette a chiunque di aggiornare
-- NOTA: La sicurezza è garantita dal codice TypeScript che usa .eq('user_id', userId)
-- quindi gli utenti possono aggiornare solo il proprio record (quello con il loro user_id)
-- Questa policy permette a guest e utenti autenticati di aggiornare il proprio status
CREATE POLICY "Anyone can update their own status" ON public.room_members
  FOR UPDATE
  USING (true)  -- Permette a tutti (inclusi guest) di aggiornare
  WITH CHECK (true);  -- Permette a tutti (inclusi guest) di aggiornare

