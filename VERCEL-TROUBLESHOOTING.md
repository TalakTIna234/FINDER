# Troubleshooting Vercel Deployment

## Problema: Preview Deployment Protetto

L'URL fornito (`https://finder-f8vxau1su-talaktina234s-projects.vercel.app`) è un **preview deployment** che richiede autenticazione Vercel.

### Soluzione 1: Usa l'URL di Produzione

Vercel fornisce anche un URL di produzione. Controlla nel dashboard Vercel:
1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto **FINDER**
3. Cerca l'URL di **Production** (dovrebbe essere tipo `https://finder.vercel.app` o simile)
4. Usa quell'URL invece del preview deployment

### Soluzione 2: Rendi il Preview Pubblico

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto **FINDER**
3. Vai su **Settings** → **Deployment Protection**
4. Disabilita la protezione per i preview deployments (se applicabile)

## Problemi Comuni e Soluzioni

### 1. Errori 401/403 da Supabase

**Sintomo**: Console mostra errori 401 o "new row violates row-level security policy"

**Soluzione**:
- Verifica che le variabili d'ambiente siano configurate in Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Assicurati che siano selezionate per **Production**, **Preview** e **Development**
- Verifica che lo schema SQL sia stato eseguito in Supabase

### 2. Immagini TMDB non caricano (403)

**Sintomo**: Poster dei film non si caricano

**Soluzione**:
- Verifica che `VITE_TMDB_ACCESS_TOKEN` sia configurato in Vercel
- Il meta tag `<meta name="referrer" content="no-referrer-when-downgrade">` è già presente in `index.html`
- Se il problema persiste, potrebbe essere necessario un proxy CORS

### 3. OAuth non funziona

**Sintomo**: Login con Google/Apple non funziona

**Soluzione**:
1. **Aggiorna Redirect URLs in Supabase**:
   - Vai su Supabase Dashboard → Authentication → URL Configuration
   - Aggiungi: `https://TUO-DOMINIO-VERCEL.vercel.app`
   - Clicca **Save**

2. **Aggiorna Redirect URLs in Google Cloud Console**:
   - Vai su [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Credentials
   - Trova il tuo OAuth Client ID
   - Aggiungi nei **Authorized redirect URIs**:
     - `https://TUO-DOMINIO-VERCEL.vercel.app`
   - Clicca **Save**

### 4. Variabili d'Ambiente non caricate

**Sintomo**: App funziona ma API non rispondono

**Soluzione**:
- Verifica che le variabili in Vercel inizino con `VITE_`
- Riavvia il deployment dopo aver aggiunto/modificato variabili
- Controlla i log di build in Vercel per errori

### 5. Build fallisce

**Sintomo**: Build su Vercel fallisce

**Soluzione**:
- Verifica che `terser` sia nelle `devDependencies` (già fatto ✅)
- Controlla i log di build per errori specifici
- Assicurati che `package.json` abbia tutti i script necessari

## Test dell'App

Una volta che hai l'URL di produzione accessibile:

1. **Test Base**:
   - Apri l'URL in un browser
   - Verifica che l'app si carichi
   - Controlla la console per errori

2. **Test Autenticazione**:
   - Vai su **Profilo**
   - Prova **Accedi con Google**
   - Verifica che il redirect funzioni

3. **Test Funzionalità**:
   - Swipa alcuni film
   - Crea una stanza
   - Aggiungi film alla playlist

## Debug

Per vedere gli errori in produzione:

1. Apri la **Console del Browser** (F12)
2. Controlla la tab **Console** per errori JavaScript
3. Controlla la tab **Network** per richieste fallite
4. Cerca errori 401, 403, 500

## Contatti

Se hai problemi, verifica:
- ✅ Variabili d'ambiente configurate in Vercel
- ✅ Schema SQL eseguito in Supabase
- ✅ Redirect URLs configurati in Supabase e Google
- ✅ URL di produzione (non preview) accessibile

