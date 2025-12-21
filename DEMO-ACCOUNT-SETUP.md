# Setup Account Demo

## 📋 Creazione Account Demo

L'account demo permette di testare l'app senza doversi registrare. Le credenziali sono:
- **Email**: `demo@moviematch.app`
- **Password**: `demo`

## 🔧 Setup in Supabase

### Metodo 1: Interfaccia Supabase (Consigliato)

1. **Vai su Supabase Dashboard**
   - https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Crea Utente**
   - Vai su **Authentication** → **Users**
   - Clicca **Add User** (o **Invite User**)
   - Compila:
     - **Email**: `demo@moviematch.app`
     - **Password**: `demo`
     - **Auto Confirm User**: ✅ (spunta questa opzione)
   - Clicca **Create User**

3. **Esegui SQL per Profilo**
   - Vai su **SQL Editor**
   - Crea una nuova query
   - Copia e incolla il contenuto di `CREATE-DEMO-ACCOUNT.sql`
   - Esegui la query (Run o F5)

### Metodo 2: Solo SQL (Avanzato)

Se preferisci creare tutto via SQL:

1. **Vai su SQL Editor**
2. **Esegui questo script**:
```sql
-- Crea utente (richiede privilegi admin)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'demo@moviematch.app',
  crypt('demo', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  ''
)
ON CONFLICT (email) DO NOTHING
RETURNING id;
```

3. **Poi esegui lo script di `CREATE-DEMO-ACCOUNT.sql`**

## ✅ Verifica

Dopo aver creato l'account:

1. Vai su **Authentication** → **Users**
2. Dovresti vedere `demo@moviematch.app` nella lista
3. Vai su **Table Editor** → **users**
4. Dovresti vedere il profilo "Demo User"

## 🧪 Test

1. Vai su https://finder-sepia-ten.vercel.app
2. Vai su **Profilo**
3. Clicca **Account Demo**
4. Dovresti essere loggato automaticamente come "Demo User"

## ⚠️ Note Importanti

- **Rimuovi prima della pubblicazione**: L'account demo è solo per testing
- **Password semplice**: La password "demo" è intenzionale per facilità di test
- **Email fittizia**: `demo@moviematch.app` non è un'email reale

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

