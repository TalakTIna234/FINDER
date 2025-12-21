# 🎬 Guida Creazione Account Demo

Ci sono **3 modi** per creare l'account demo. Scegli quello più comodo per te.

## 📋 Metodo 1: Interfaccia Supabase (Più Semplice) ⭐

### Passo 1: Crea l'utente
1. Vai su **Supabase Dashboard**: https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **Authentication** → **Users**
4. Clicca **Add User** (o **Invite User**)
5. Compila:
   - **Email**: `demo@moviematch.app`
   - **Password**: `demo`
   - **Auto Confirm User**: ✅ (spunta questa opzione - IMPORTANTE!)
6. Clicca **Create User**

### Passo 2: Crea il profilo
1. Vai su **SQL Editor**
2. Clicca **New Query**
3. Copia e incolla questo SQL:

```sql
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Trova l'ID dell'utente demo
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@moviematch.app';
  
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente demo non trovato. Crea prima l''utente in Authentication → Users';
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
```

4. Clicca **Run** (o premi F5)
5. Dovresti vedere: `Success. No rows returned`

### ✅ Verifica
- Vai su **Table Editor** → **users**
- Dovresti vedere "Demo User" nella lista

---

## 🌐 Metodo 2: File HTML (Più Veloce)

### Passo 1: Ottieni la Service Role Key
1. Vai su **Supabase Dashboard** → **Settings** → **API**
2. Trova la sezione **Project API keys**
3. Copia la **`service_role`** key (⚠️ NON l'anon key! È segreta)

### Passo 2: Usa il file HTML
1. Apri il file `create-demo-account.html` nel browser
2. Inserisci:
   - **Supabase URL**: `https://ghkfvvuqkexupwqshrtt.supabase.co`
   - **Service Role Key**: (quella che hai copiato)
3. Clicca **Crea Account Demo**

### ✅ Fatto!
L'account verrà creato automaticamente.

---

## 💻 Metodo 3: Script Node.js (Per Sviluppatori)

### Passo 1: Ottieni la Service Role Key
1. Vai su **Supabase Dashboard** → **Settings** → **API**
2. Copia la **`service_role`** key

### Passo 2: Aggiungi al .env
Aggiungi questa riga al file `.env`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Passo 3: Esegui lo script
```bash
node create-demo-account.js
```

### ✅ Fatto!

---

## 🧪 Test

Dopo aver creato l'account:

1. Vai su https://finder-sepia-ten.vercel.app
2. Vai su **Profilo**
3. Clicca **Account Demo**
4. Dovresti essere loggato automaticamente come "Demo User"

---

## ⚠️ Note Importanti

- **Rimuovi prima della pubblicazione**: L'account demo è solo per testing
- **Password semplice**: La password "demo" è intenzionale per facilità di test
- **Email fittizia**: `demo@moviematch.app` non è un'email reale
- **Auto Confirm**: Assicurati di spuntare "Auto Confirm User" quando crei l'utente

---

## 🗑️ Rimozione Account Demo

Prima della pubblicazione, rimuovi l'account:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Trova `demo@moviematch.app`
3. Clicca sui tre puntini → **Delete User**

Oppure via SQL:
```sql
DELETE FROM public.user_stats WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@moviematch.app');
DELETE FROM public.users WHERE email = 'demo@moviematch.app';
DELETE FROM auth.users WHERE email = 'demo@moviematch.app';
```

---

## ❓ Problemi?

### "Utente demo non trovato"
- Assicurati di aver creato l'utente in **Authentication** → **Users** prima di eseguire lo SQL

### "Error: duplicate key value"
- L'account esiste già, è normale. Lo script lo aggiornerà.

### "Auth session missing"
- L'utente potrebbe non essere stato confermato. Assicurati di spuntare "Auto Confirm User" quando lo crei.

### Service Role Key non funziona
- Verifica di aver copiato la **service_role** key, non l'anon key
- La service_role key inizia con `eyJ...` ed è molto lunga

