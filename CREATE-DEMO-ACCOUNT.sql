-- Script per creare account demo
-- Esegui questo SQL nel SQL Editor di Supabase DOPO aver creato l'utente con auth

-- IMPORTANTE: Prima devi creare l'utente tramite l'interfaccia Supabase o tramite API
-- Poi esegui questo script per creare il profilo

-- Passo 1: Crea l'utente tramite Supabase Dashboard
-- Vai su Authentication → Users → Add User
-- Email: demo@moviematch.app
-- Password: demo
-- Auto Confirm User: ✅ (spunta questa opzione)

-- Passo 2: Dopo aver creato l'utente, esegui questo SQL per creare il profilo
-- (Sostituisci USER_ID con l'ID dell'utente appena creato)

-- Trova l'ID dell'utente demo
-- SELECT id FROM auth.users WHERE email = 'demo@moviematch.app';

-- Poi esegui questo (sostituisci USER_ID con l'ID trovato):
/*
INSERT INTO public.users (id, email, nickname, provider, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@moviematch.app'),
  'demo@moviematch.app',
  'Demo User',
  'email',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nickname = 'Demo User',
  updated_at = NOW();

-- Crea statistiche iniziali
INSERT INTO public.user_stats (user_id, movies_liked, matches_found, rooms_created, rooms_joined, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@moviematch.app'),
  0, 0, 0, 0, NOW()
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- ALTERNATIVA: Script completo che crea tutto automaticamente
-- (Richiede che l'utente sia già stato creato in auth.users)

DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Trova l'ID dell'utente demo
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@moviematch.app';
  
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente demo non trovato. Crea prima l''utente in Authentication → Users con email demo@moviematch.app e password demo';
  END IF;
  
  -- Crea/aggiorna profilo
  INSERT INTO public.users (id, email, nickname, provider, created_at, updated_at)
  VALUES (demo_user_id, 'demo@moviematch.app', 'Demo User', 'email', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    nickname = 'Demo User',
    updated_at = NOW();
  
  -- Crea statistiche iniziali
  INSERT INTO public.user_stats (user_id, movies_liked, matches_found, rooms_created, rooms_joined, updated_at)
  VALUES (demo_user_id, 0, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Account demo creato con successo!';
END $$;

