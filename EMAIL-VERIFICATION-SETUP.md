# 📧 Setup Verifica Email

## ✅ Funzionalità Implementate

1. **Verifica Email Automatica**: Supabase invia automaticamente un'email di conferma quando un utente si registra
2. **Autocompletamento Domini**: Suggerimenti intelligenti per domini email comuni
3. **Gestione Email Esistente**: Se l'email è già registrata, viene suggerito il login

## 🔧 Configurazione Supabase

### 1. Verifica Email Templates

1. Vai su **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Personalizza i template se necessario:
   - **Confirm signup**: Email di conferma registrazione
   - **Magic Link**: Link magico per login
   - **Change Email Address**: Cambio email

### 2. Configurazione Email (SMTP)

Per inviare email reali, configura SMTP:

1. Vai su **Supabase Dashboard** → **Settings** → **Auth**
2. Scorri fino a **SMTP Settings**
3. Configura:
   - **SMTP Host**: (es: smtp.gmail.com)
   - **SMTP Port**: (es: 587)
   - **SMTP User**: La tua email
   - **SMTP Password**: Password app per Gmail o password SMTP
   - **Sender Email**: Email che invia le notifiche
   - **Sender Name**: Nome del mittente

**Nota**: Per Gmail, devi creare una "Password app" in Google Account → Sicurezza → Password app.

### 3. Site URL e Redirect URLs

1. Vai su **Settings** → **Auth**
2. Verifica:
   - **Site URL**: `https://finder-sepia-ten.vercel.app`
   - **Redirect URLs**: Deve includere `https://finder-sepia-ten.vercel.app`

## 🧪 Test Verifica Email

### Test 1: Registrazione
1. Vai su **Profilo** → **Accedi con Email** → **Registrati**
2. Compila il form
3. Clicca **Registrati**
4. Dovresti vedere: "Registrazione completata! Controlla la tua email per confermare l'account."

### Test 2: Email di Conferma
1. Controlla la casella email (anche spam)
2. Dovresti ricevere un'email da Supabase
3. Clicca sul link di conferma
4. Dovresti essere reindirizzato all'app e loggato automaticamente

### Test 3: Login Senza Conferma
1. Prova ad accedere senza aver confermato l'email
2. Dovresti vedere un messaggio che indica di confermare l'email

## 🎯 Autocompletamento Domini

L'autocompletamento funziona così:

1. **Digita dopo la @**: Es: `mario@g` → suggerisce `gmail.com` e `gmail.it`
2. **Navigazione**: Usa frecce ↑↓ per navigare tra suggerimenti
3. **Selezione**: Premi Enter o Tab per selezionare
4. **Modifica**: Puoi sempre modificare manualmente il dominio

### Domini Supportati

- **Gmail**: `g`, `gm`, `gmai`, `gmail` → `gmail.com`, `gmail.it`
- **Yahoo**: `y`, `yahoo` → `yahoo.com`, `yahoo.it`
- **Hotmail**: `h`, `hotmail` → `hotmail.com`, `hotmail.it`
- **Outlook**: `o`, `outlook` → `outlook.com`, `outlook.it`
- **Live**: `l`, `live` → `live.com`, `live.it`
- **iCloud**: `i`, `icloud` → `icloud.com`
- **AOL**: `a`, `aol` → `aol.com`, `aol.it`
- **MSN**: `m`, `msn` → `msn.com`, `msn.it`
- **Provider.it**: `p`, `provider` → `provider.it`
- **Tiscali**: `t`, `tiscali` → `tiscali.it`
- **Virgilio**: `v`, `virgilio` → `virgilio.it`
- **Libero**: `l`, `libero` → `libero.it`

## 🔍 Gestione Email Esistente

Se un utente prova a registrarsi con un'email già usata (es: già registrata con Google OAuth):

1. Viene mostrato un messaggio: "Questa email è già registrata. Vuoi accedere invece?"
2. Se clicca **OK**: Passa automaticamente alla modalità login
3. Se clicca **Annulla**: Può provare con un'altra email

## ⚠️ Note Importanti

- **Email di Test**: In sviluppo, Supabase può inviare email di test (controlla la console)
- **Spam Folder**: Le email di conferma potrebbero finire in spam
- **Link Scadenza**: I link di conferma scadono dopo un certo tempo (configurabile in Supabase)
- **Auto-Confirm**: In sviluppo, puoi disabilitare la verifica email in Supabase Settings → Auth → "Enable email confirmations"

## 🚀 Produzione

Prima di andare in produzione:
1. Configura SMTP reale (non usare il servizio di test)
2. Personalizza i template email con il tuo branding
3. Abilita "Enable email confirmations" in Supabase
4. Testa il flusso completo di registrazione e conferma

