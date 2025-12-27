# ⚠️ IMPORTANTE: Esegui questa Migration SQL

Stai ricevendo un errore perché il database non permette ancora lo status `'lobby'`.

## Come risolvere:

1. Vai su **Supabase Dashboard** → Il tuo progetto → **SQL Editor**
2. Apri il file `supabase-add-lobby-status.sql` (o copia il codice qui sotto)
3. **Esegui** il codice SQL

## Codice da eseguire:

```sql
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
```

## Dopo aver eseguito:

1. Ricarica l'app
2. Prova di nuovo a creare una stanza
3. Dovrebbe funzionare! ✅

---

**Nota**: Se hai già membri esistenti con status 'ready', non verranno modificati. Solo i nuovi membri partiranno con 'lobby'.

