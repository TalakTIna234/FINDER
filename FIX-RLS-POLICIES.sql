-- Fix per RLS Policies - Esegui questo nel SQL Editor di Supabase
-- Questo assicura che gli utenti possano creare il proprio profilo dopo OAuth

-- Elimina policy esistenti per INSERT se ci sono
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Policy: Users possono inserire il proprio profilo (necessario per OAuth)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verifica che la policy esista
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile';

