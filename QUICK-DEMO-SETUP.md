# ⚡ Setup Rapido Account Demo

## 🎯 Metodo Veloce (2 minuti)

### Passo 1: Crea l'utente in Supabase

1. **Apri**: https://supabase.com/dashboard
2. **Seleziona** il tuo progetto
3. **Vai su**: Authentication → Users
4. **Clicca**: "Add User" (o "Invite User")
5. **Compila**:
   - Email: `demo@moviematch.app`
   - Password: `demo`
   - ✅ **Auto Confirm User** (SPUNTA QUESTA - IMPORTANTE!)
6. **Clicca**: "Create User"

### Passo 2: Esegui SQL

1. **Vai su**: SQL Editor (menu laterale)
2. **Clicca**: "New Query"
3. **Copia e incolla** questo SQL:

```sql
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@moviematch.app';
  
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente demo non trovato. Crea prima l''utente in Authentication → Users';
  END IF;
  
  INSERT INTO public.users (id, email, nickname, provider, created_at, updated_at)
  VALUES (demo_user_id, 'demo@moviematch.app', 'Demo User', 'email', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    nickname = 'Demo User',
    updated_at = NOW();
  
  INSERT INTO public.user_stats (user_id, movies_liked, matches_found, rooms_created, rooms_joined, updated_at)
  VALUES (demo_user_id, 0, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Account demo creato con successo!';
END $$;
```

4. **Clicca**: "Run" (o premi F5)
5. **Dovresti vedere**: `Success. No rows returned`

### ✅ Fatto!

Ora puoi testare:
1. Vai su https://finder-sepia-ten.vercel.app
2. Vai su **Profilo**
3. Clicca **Account Demo**
4. Dovresti essere loggato! 🎉

---

## 🔧 Metodo Alternativo: File HTML

Se preferisci un'interfaccia grafica:

1. **Ottieni la Service Role Key**:
   - Supabase Dashboard → Settings → API
   - Copia la **`service_role`** key (non l'anon key!)

2. **Apri** `create-demo-account.html` nel browser

3. **Inserisci**:
   - URL: `https://ghkfvvuqkexupwqshrtt.supabase.co`
   - Service Role Key: (quella copiata)

4. **Clicca**: "Crea Account Demo"

---

## ❓ Problemi?

- **"Utente demo non trovato"** → Assicurati di aver creato l'utente prima di eseguire lo SQL
- **"Error: duplicate key"** → L'account esiste già, è normale
- **"Auth session missing"** → Assicurati di aver spuntato "Auto Confirm User"

