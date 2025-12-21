# Configurazione Google OAuth - Istruzioni Rapide

## ✅ Credenziali Fornite

⚠️ **IMPORTANTE**: Le credenziali OAuth sono sensibili e non devono essere committate su GitHub!

Inserisci le tue credenziali qui:
- **Client ID**: `INSERISCI_IL_TUO_CLIENT_ID`
- **Client Secret**: `INSERISCI_IL_TUO_CLIENT_SECRET`
- **Callback URL**: `https://ghkfvvuqkexupwqshrtt.supabase.co/auth/v1/callback`

## Passo 1: Configura in Supabase Dashboard

1. Vai su **Supabase Dashboard**: https://supabase.com/dashboard/project/ghkfvvuqkexupwqshrtt
2. Vai su **Authentication** (icona chiave nella sidebar sinistra)
3. Clicca su **Providers** (tab in alto)
4. Trova **Google** nella lista dei provider
5. Clicca sul toggle per **abilitare Google**
6. Compila i campi con le tue credenziali OAuth:
   - **Client ID (for OAuth)**: `INSERISCI_IL_TUO_CLIENT_ID`
   - **Client Secret (for OAuth)**: `INSERISCI_IL_TUO_CLIENT_SECRET`
7. Clicca **Save**

## Passo 2: Verifica Redirect URLs

1. Nello stesso dashboard, vai su **URL Configuration** (sotto Providers)
2. Assicurati che ci siano questi **Redirect URLs**:
   - `http://localhost:3000` (per sviluppo)
   - `https://tuodominio.com` (per produzione - quando deployi)
   - `https://ghkfvvuqkexupwqshrtt.supabase.co/auth/v1/callback` (già configurato automaticamente da Supabase)
3. Se manca `http://localhost:3000`, aggiungilo e clicca **Save**

## Passo 3: Verifica in Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Vai su **APIs & Services** → **Credentials**
3. Trova il tuo OAuth 2.0 Client ID
4. Verifica che nei **Authorized redirect URIs** ci sia:
   - `https://ghkfvvuqkexupwqshrtt.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (se vuoi testare in locale)

## Passo 4: Test

1. Avvia l'app: `npm run dev`
2. Vai su **Profilo** nell'app
3. Clicca **Accedi con Google**
4. Dovresti essere reindirizzato a Google per il login
5. Dopo il login, torni all'app e il profilo viene creato automaticamente

## ✅ Fine!

Dopo questi passaggi, il login con Google dovrebbe funzionare!

