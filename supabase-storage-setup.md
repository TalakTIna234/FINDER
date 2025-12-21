# Setup Storage per Avatar

## Passo 1: Crea Bucket per Avatar

1. Nel dashboard Supabase, vai su **Storage** (icona archivio nella sidebar)
2. Clicca "Create a new bucket"
3. Compila:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Sì (spunta la checkbox - IMPORTANTE!)
4. Clicca "Create bucket"

## Passo 2: Configura Policies

1. Clicca sul bucket `avatars` appena creato
2. Vai su **Policies**
3. Clicca "New Policy" → "For full customization"
4. Nome: "Users can upload own avatar"
5. Policy SQL:

```sql
-- Allow authenticated users to upload their own avatar
(bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

6. Clicca "Review" e "Save policy"

## Passo 3: Policy per Lettura (se necessario)

Se le immagini non si caricano, aggiungi anche questa policy:

1. Clicca "New Policy" → "For full customization"
2. Nome: "Public read access"
3. Policy SQL:

```sql
-- Allow public read access
bucket_id = 'avatars'::text
```

4. Clicca "Review" e "Save policy"

## Fine!

Ora gli utenti possono caricare avatar che verranno salvati in `avatars/{user_id}/filename.jpg`

