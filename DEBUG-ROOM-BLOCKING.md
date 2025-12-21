# 🔍 Debug Blocco Stanza - Guida Completa

## 🐛 Problema

Dopo aver selezionato un genere o inserito un codice stanza, l'app rimane bloccata su "Discovery in corso..." e non procede.

## 🔧 Fix Applicato

### 1. Logging Dettagliato
Aggiunto logging completo in ogni step:
- ✅ Timestamp di ogni operazione
- ✅ Tempo impiegato per ogni fase
- ✅ Dettagli completi degli errori
- ✅ Verifica esistenza tabelle prima di procedere

### 2. Timeout di Sicurezza
- ✅ Timeout di 30 secondi per evitare blocchi infiniti
- ✅ Messaggio chiaro se il timeout viene raggiunto

### 3. Gestione Errori Migliorata
- ✅ Verifica esistenza tabelle prima di creare stanza
- ✅ Messaggi di errore specifici per ogni tipo di problema
- ✅ Istruzioni chiare su come risolvere

## 📋 Checklist Debug

### 1. Verifica Tabelle Supabase

**IMPORTANTE**: Le tabelle DEVONO esistere!

1. Vai su **Supabase Dashboard** → **Table Editor**
2. Verifica che vedi:
   - ✅ `rooms`
   - ✅ `room_members`
3. Se NON le vedi:
   - Vai su **SQL Editor**
   - Esegui `supabase-rooms-schema.sql`
   - Verifica di nuovo

### 2. Verifica RLS Policies

Le RLS policies DEVONO essere configurate:

1. Vai su **Supabase Dashboard** → **Authentication** → **Policies**
2. Verifica che esistano:
   - ✅ "Anyone can read rooms" (SELECT)
   - ✅ "Authenticated users can create rooms" (INSERT)
   - ✅ "Anyone can read room members" (SELECT)
   - ✅ "Authenticated users can join rooms" (INSERT)

### 3. Verifica Autenticazione

L'utente DEVE essere autenticato:

1. Apri la console del browser (F12)
2. Cerca: `User authenticated:`
3. Se non vedi questo messaggio, l'utente non è autenticato
4. **Soluzione**: Effettua il login prima di creare una stanza

## 🧪 Test con Console Aperta

### Test Creazione Stanza

1. **Apri Console** (F12)
2. **Vai su Home** → **Crea Stanza**
3. **Seleziona un genere**
4. **Osserva i log in console**:

Dovresti vedere questa sequenza:
```
=== STARTING GENRE SELECTION ===
[1/4] Loading movies from TMDB...
[1/4] Movies loaded in XXXms: XX
[2/4] Checking authentication...
[2/4] Auth check completed in XXXms
User authenticated: [user-id] [nickname]
[3/4] Creating room in Supabase...
=== CREATE ROOM START ===
Checking if rooms table exists...
Generated unique code: ABC123
Inserting room into database...
Room insert completed in XXXms
Room created in database: [room-id]
Adding host as member...
Member insert completed in XXXms
Host added as member successfully
=== CREATE ROOM SUCCESS ===
[4/4] Room created successfully: ABC123
Setting step to lobby...
=== GENRE SELECTION COMPLETED SUCCESSFULLY ===
```

### Se Vedi Errori

#### Errore: "La tabella 'rooms' non esiste"
**Soluzione**: Esegui `supabase-rooms-schema.sql` nel SQL Editor

#### Errore: "permission denied" o "policy"
**Soluzione**: Verifica che le RLS policies siano state create (vedi `supabase-rooms-schema.sql`)

#### Errore: "User not authenticated"
**Soluzione**: Effettua il login prima di creare una stanza

#### Timeout dopo 30 secondi
**Causa**: Qualcosa sta bloccando il processo
**Soluzione**: 
1. Controlla i log in console per vedere dove si blocca
2. Verifica la connessione internet
3. Verifica che Supabase sia raggiungibile

## 🔍 Debug Step-by-Step

### Step 1: Verifica Tabelle
```sql
-- Esegui questo in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rooms', 'room_members');
```

**Risultato atteso**: Dovresti vedere entrambe le tabelle

### Step 2: Verifica RLS
```sql
-- Esegui questo in Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename IN ('rooms', 'room_members');
```

**Risultato atteso**: Dovresti vedere le policies per entrambe le tabelle

### Step 3: Test Inserimento Manuale
```sql
-- Esegui questo in Supabase SQL Editor (sostituisci USER_ID con un ID utente reale)
INSERT INTO public.rooms (code, host_id, host_nickname, movies, status)
VALUES ('TEST01', 'USER_ID_QUI', 'Test User', '[]'::jsonb, 'lobby')
RETURNING *;
```

**Risultato atteso**: Dovresti vedere la stanza creata

## 📊 Log da Controllare

Quando provi a creare una stanza, controlla la console per:

1. **"=== STARTING GENRE SELECTION ==="** - Inizio processo
2. **"[1/4] Movies loaded"** - Film caricati
3. **"[2/4] Auth check completed"** - Autenticazione verificata
4. **"[3/4] Creating room"** - Inizio creazione stanza
5. **"=== CREATE ROOM START ==="** - Inizio creazione
6. **"Room created in database"** - Stanza creata
7. **"Host added as member"** - Host aggiunto
8. **"=== CREATE ROOM SUCCESS ==="** - Successo
9. **"Setting step to lobby"** - Cambio step

**Se manca uno di questi log**, quello è il punto dove si blocca.

## ✅ Prossimi Passi

1. **Apri la console** (F12)
2. **Prova a creare una stanza**
3. **Copia tutti i log** dalla console
4. **Incolla qui** e ti aiuterò a identificare il problema

## 🚀 Fix Deployato

Le modifiche sono state pushate. Vercel farà il deploy automatico in 1-2 minuti.

**Dopo il deploy**:
1. Ricarica l'app (Ctrl+F5)
2. Apri la console (F12)
3. Prova a creare una stanza
4. Controlla i log per vedere dove si blocca

