# Deploy su Vercel - Guida Step by Step

## ✅ Prerequisiti

1. Account GitHub (gratuito)
2. Account Vercel (gratuito, puoi usare GitHub per registrarti)
3. Progetto già su GitHub (opzionale, ma consigliato)

## 📋 Step 1: Preparazione Progetto

### 1.1 Verifica Build Locale

Prima di deployare, verifica che il build funzioni:

```bash
npm run build
```

Se funziona, vedrai la cartella `dist/` creata.

### 1.2 Crea Repository GitHub (se non ce l'hai)

1. Vai su https://github.com/new
2. Crea un nuovo repository (es: `moviematch`)
3. **NON** inizializzare con README (se il progetto esiste già)
4. Copia l'URL del repository

### 1.3 Push su GitHub

```bash
git init
git add .
git commit -m "Initial commit - MovieMatch app"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/moviematch.git
git push -u origin main
```

## 📋 Step 2: Deploy su Vercel

### 2.1 Crea Account Vercel

1. Vai su https://vercel.com
2. Clicca **Sign Up**
3. Scegli **Continue with GitHub**
4. Autorizza Vercel ad accedere ai tuoi repository

### 2.2 Importa Progetto

1. Nel dashboard Vercel, clicca **Add New...** → **Project**
2. Seleziona il repository `moviematch` dalla lista
3. Clicca **Import**

### 2.3 Configurazione Build

Vercel dovrebbe rilevare automaticamente:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Se non è così, configura manualmente:
- **Framework Preset**: Vite
- **Root Directory**: `./` (lasciare vuoto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.4 Configura Variabili d'Ambiente

**IMPORTANTE**: Prima di cliccare **Deploy**, aggiungi le variabili d'ambiente:

1. Nella sezione **Environment Variables**, clicca **Add**
2. Aggiungi queste variabili (una per volta):

   ```
   Name: VITE_TMDB_ACCESS_TOKEN
   Value: 2b17a9d8b3bfa7402c41265da99c97ae
   ```

   ```
   Name: VITE_SUPABASE_URL
   Value: https://ghkfvvuqkexupwqshrtt.supabase.co
   ```

   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoa2Z2dnVxa2V4dXB3cXNocnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjQzMDMsImV4cCI6MjA4MTkwMDMwM30.ga9XCScsZloKJnzjOcTamTrU8IrkYV5K8oMTXw7Yhbs
   ```

3. Per ogni variabile, seleziona tutti gli ambienti:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 2.5 Deploy!

1. Clicca **Deploy**
2. Attendi 2-3 minuti per il build
3. Vercel ti darà un URL tipo: `https://moviematch-xxxxx.vercel.app`

## 📋 Step 3: Configura OAuth Redirect URLs

### 3.1 Aggiorna Supabase

1. Vai su **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Aggiungi il nuovo **Redirect URL**:
   ```
   https://TUO-DOMINIO-VERCEL.vercel.app
   ```
3. Clicca **Save**

### 3.2 Aggiorna Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Trova il tuo OAuth Client ID
4. Aggiungi nei **Authorized redirect URIs**:
   ```
   https://TUO-DOMINIO-VERCEL.vercel.app
   ```
5. Clicca **Save**

## 📋 Step 4: Test

1. Vai sul tuo dominio Vercel
2. Vai su **Profilo**
3. Clicca **Accedi con Google**
4. Dovrebbe funzionare! 🎉

## 🔄 Aggiornamenti Futuri

Ogni volta che fai `git push` su GitHub, Vercel deploya automaticamente una nuova versione!

## 📝 Note

- Il primo deploy può richiedere 3-5 minuti
- Vercel offre un dominio gratuito tipo `moviematch.vercel.app`
- Puoi aggiungere un dominio personalizzato dopo (opzionale)

