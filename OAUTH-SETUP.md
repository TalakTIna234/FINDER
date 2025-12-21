# Setup OAuth per Google e Apple

## ⚠️ IMPORTANTE: Configurazione Richiesta

Per far funzionare il login con Google e Apple, devi configurare i provider OAuth nel dashboard Supabase.

## Passo 1: Configura Google OAuth

1. Vai su **Supabase Dashboard** → **Authentication** → **Providers**
2. Trova **Google** e clicca per abilitarlo
3. Vai su [Google Cloud Console](https://console.cloud.google.com/)
4. Crea un nuovo progetto o seleziona uno esistente
5. Vai su **APIs & Services** → **Credentials**
6. Clicca **Create Credentials** → **OAuth client ID**
7. Scegli **Web application**
8. Aggiungi questi **Authorized redirect URIs**:
   - `https://ghkfvvuqkexupwqshrtt.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (per sviluppo locale)
9. Copia **Client ID** e **Client Secret**
10. Incolla in Supabase Dashboard → **Google Provider**:
    - **Client ID (for OAuth)**: incolla il Client ID
    - **Client Secret (for OAuth)**: incolla il Client Secret
11. Clicca **Save**

## Passo 2: Configura Apple OAuth

1. Vai su **Supabase Dashboard** → **Authentication** → **Providers**
2. Trova **Apple** e clicca per abilitarlo
3. Vai su [Apple Developer Portal](https://developer.apple.com/)
4. Crea un **Service ID** e una **Key**
5. Configura i redirect URLs:
   - `https://ghkfvvuqkexupwqshrtt.supabase.co/auth/v1/callback`
6. In Supabase Dashboard → **Apple Provider**, inserisci:
   - **Client ID (for OAuth)**: il tuo Service ID
   - **Client Secret (for OAuth)**: la tua Key
7. Clicca **Save**

## Passo 3: Configura Redirect URLs in Supabase

1. Vai su **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Aggiungi questi **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (sviluppo)
   - `https://tuodominio.com/auth/callback` (produzione)
3. Clicca **Save**

## Passo 4: Test

1. Avvia l'app: `npm run dev`
2. Vai su **Profilo**
3. Clicca **Accedi con Google** o **Accedi con Apple**
4. Dovresti essere reindirizzato al provider OAuth
5. Dopo il login, verrai reindirizzato all'app e il profilo verrà creato automaticamente

## Note

- **Google OAuth** è più semplice da configurare e consigliato per iniziare
- **Apple OAuth** richiede un account Apple Developer (a pagamento)
- Per sviluppo/test, puoi usare solo Google OAuth
- Il profilo viene creato automaticamente al primo login OAuth

## Troubleshooting

### Errore "redirect_uri_mismatch"
- Verifica che i redirect URLs in Google Cloud Console corrispondano a quelli in Supabase
- Assicurati di aver aggiunto `http://localhost:3000/auth/callback` per sviluppo

### Errore "OAuth provider not enabled"
- Verifica che il provider sia abilitato in Supabase Dashboard → Authentication → Providers

### L'utente viene reindirizzato ma non viene loggato
- Controlla la console del browser per errori
- Verifica che le tabelle `users` e `user_stats` esistano nel database
- Verifica che le RLS policies permettano l'inserimento

