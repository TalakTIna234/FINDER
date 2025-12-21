# Deploy su Vercel - Istruzioni Finali

## ✅ Repository GitHub Pronto!

Il tuo codice è su: https://github.com/TalakTIna234/FINDER

## Step 1: Crea Account Vercel

1. Vai su https://vercel.com
2. Clicca **Sign Up**
3. Scegli **Continue with GitHub**
4. Autorizza Vercel ad accedere ai tuoi repository GitHub

## Step 2: Importa Progetto

1. Nel dashboard Vercel, clicca **Add New...** → **Project**
2. Seleziona il repository **TalakTIna234/FINDER** dalla lista
3. Clicca **Import**

## Step 3: Configurazione Build

Vercel dovrebbe rilevare automaticamente:
- **Framework Preset**: Vite ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `dist` ✅
- **Install Command**: `npm install` ✅

Se non è così, configura manualmente:
- **Framework Preset**: Vite
- **Root Directory**: `./` (lasciare vuoto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Step 4: ⚠️ IMPORTANTE - Variabili d'Ambiente

**PRIMA di cliccare "Deploy"**, aggiungi le variabili d'ambiente:

1. Nella sezione **Environment Variables**, clicca **Add**
2. Aggiungi queste variabili (una per volta):

   **Variabile 1:**
   ```
   Name: VITE_TMDB_ACCESS_TOKEN
   Value: 2b17a9d8b3bfa7402c41265da99c97ae
   ```
   Seleziona: ✅ Production, ✅ Preview, ✅ Development

   **Variabile 2:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://ghkfvvuqkexupwqshrtt.supabase.co
   ```
   Seleziona: ✅ Production, ✅ Preview, ✅ Development

   **Variabile 3:**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoa2Z2dnVxa2V4dXB3cXNocnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjQzMDMsImV4cCI6MjA4MTkwMDMwM30.ga9XCScsZloKJnzjOcTamTrU8IrkYV5K8oMTXw7Yhbs
   ```
   Seleziona: ✅ Production, ✅ Preview, ✅ Development

3. Clicca **Save** per ogni variabile

## Step 5: Deploy!

1. Clicca **Deploy**
2. Attendi 2-3 minuti per il build
3. Vercel ti darà un URL tipo: `https://finder-xxxxx.vercel.app`

## Step 6: Aggiorna Redirect URLs

Dopo il deploy, aggiorna i redirect URLs:

### In Supabase:
1. Vai su **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Aggiungi il nuovo **Redirect URL**:
   ```
   https://TUO-DOMINIO-VERCEL.vercel.app
   ```
3. Clicca **Save**

### In Google Cloud Console:
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Trova il tuo OAuth Client ID
4. Aggiungi nei **Authorized redirect URIs**:
   ```
   https://TUO-DOMINIO-VERCEL.vercel.app
   ```
5. Clicca **Save**

## Step 7: Test!

1. Vai sul tuo dominio Vercel
2. Vai su **Profilo**
3. Clicca **Accedi con Google**
4. Dovrebbe funzionare! 🎉

## 🔄 Aggiornamenti Futuri

Ogni volta che fai `git push` su GitHub, Vercel deploya automaticamente una nuova versione!

