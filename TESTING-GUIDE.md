# Guida Completa ai Test - MovieMatch

## ✅ Test Completati

### 1. Deploy e Accessibilità
- ✅ App deployata su Vercel: https://finder-sepia-ten.vercel.app
- ✅ App si carica correttamente
- ✅ Nessun errore di build
- ✅ Navigazione funziona (Home, Match, Profilo)

### 2. OAuth e Autenticazione
- ✅ Pulsante "Accedi con Google" funziona
- ✅ Redirect a Google OAuth funziona correttamente
- ✅ Redirect URL configurato: `https://finder-sepia-ten.vercel.app`
- ⚠️ **Da testare**: Login completo con account reale (callback dopo OAuth)

### 3. UI e Navigazione
- ✅ Home view si carica correttamente
- ✅ Match view si carica correttamente (mostra playlist vuota)
- ✅ Profilo view si carica correttamente (mostra opzioni login)
- ✅ Navigazione tra tab funziona

## 🧪 Test da Eseguire

### Test 1: Login Completo OAuth
**Obiettivo**: Verificare che il login completo funzioni end-to-end

**Passi**:
1. Vai su https://finder-sepia-ten.vercel.app
2. Clicca su **Profilo**
3. Clicca su **Accedi con Google**
4. Completa il login su Google
5. Verifica che vieni reindirizzato all'app
6. Verifica che il profilo mostri i tuoi dati

**Risultato atteso**: 
- Redirect a Google ✅
- Login completato ✅
- Profilo aggiornato con dati utente ✅

**Note**: 
- Se il redirect non funziona, verifica:
  - Supabase Dashboard → Authentication → URL Configuration
  - Site URL deve essere: `https://finder-sepia-ten.vercel.app`
  - Redirect URLs deve includere: `https://finder-sepia-ten.vercel.app`

### Test 2: Caricamento Film da TMDB
**Obiettivo**: Verificare che i film si carichino correttamente

**Passi**:
1. Accedi con un account (Google/Apple)
2. Vai su **Home**
3. Clicca su **Crea Stanza** (ora disponibile)
4. Seleziona **Per Genere**
5. Scegli un genere (es: Azione)
6. Attendi il caricamento

**Risultato atteso**:
- Film si caricano dalla TMDB API ✅
- Poster dei film si visualizzano ✅
- Lobby stanza si crea con codice ✅

**Note**:
- Se i film non si caricano, verifica:
  - Variabile d'ambiente `VITE_TMDB_ACCESS_TOKEN` in Vercel
  - Console browser per errori API
  - Network tab per richieste fallite

### Test 3: Swipe Film
**Obiettivo**: Verificare che lo swipe funzioni correttamente

**Passi**:
1. Dopo aver creato una stanza e selezionato un genere
2. Clicca su **Inizia Match** nella lobby
3. Swipa i film:
   - **Swipe destro** (→): Mi piace
   - **Swipe sinistro** (←): Non mi piace
   - **Swipe su** (↑): Vedi dettagli
4. Continua fino alla fine

**Risultato atteso**:
- Swipe funziona correttamente ✅
- Animazioni fluide ✅
- Film vengono aggiunti alla playlist se piacciono ✅
- Statistiche vengono aggiornate ✅

### Test 4: Playlist
**Obiettivo**: Verificare che i film salvati appaiano nella playlist

**Passi**:
1. Dopo aver fatto swipe su alcuni film
2. Vai su **Match** (tab playlist)
3. Verifica che i film salvati siano presenti
4. Prova a rimuovere un film

**Risultato atteso**:
- Film salvati appaiono nella playlist ✅
- Film raggruppati per genere ✅
- Rimozione funziona ✅
- Dati salvati su Supabase (se autenticato) ✅

### Test 5: Stanze Multiplayer
**Obiettivo**: Verificare che le stanze multiplayer funzionino

**Passi**:
1. **Creazione Stanza**:
   - Crea una stanza e seleziona un genere
   - Copia il codice stanza
   - Condividi il codice con un altro utente

2. **Join Stanza**:
   - Apri l'app su un altro dispositivo/browser
   - Vai su **Home** → **Entra**
   - Inserisci il codice stanza
   - Clicca **Entra in Stanza**

3. **Lobby**:
   - Verifica che entrambi gli utenti siano nella lobby
   - Verifica che l'host possa avviare la sessione

4. **Sessione Multiplayer**:
   - Avvia la sessione
   - Entrambi gli utenti swipano i film
   - Verifica che i match vengano trovati

**Risultato atteso**:
- Creazione stanza funziona ✅
- Join stanza funziona ✅
- Lobby mostra tutti i membri ✅
- Sessione multiplayer funziona ✅
- Match vengono trovati correttamente ✅

### Test 6: Profilo e Statistiche
**Obiettivo**: Verificare che profilo e statistiche funzionino

**Passi**:
1. Vai su **Profilo**
2. Modifica nickname e bio
3. Salva le modifiche
4. Verifica le statistiche:
   - Film Salvati
   - Stanze Create
   - Match Trovati

**Risultato atteso**:
- Modifica profilo funziona ✅
- Statistiche si aggiornano ✅
- Dati salvati su Supabase ✅

### Test 7: Ricerca Amici
**Obiettivo**: Verificare che la ricerca amici funzioni

**Passi**:
1. Vai su **Profilo**
2. Cerca un utente per nickname
3. Invia richiesta di amicizia
4. Verifica che la richiesta venga inviata

**Risultato atteso**:
- Ricerca funziona ✅
- Invio richiesta funziona ✅
- Dati salvati su Supabase ✅

## 🐛 Problemi Conosciuti

### 1. Warning Tailwind CDN
**Messaggio**: `cdn.tailwindcss.com should not be used in production`

**Impatto**: Basso (non blocca l'app)

**Soluzione**: Installare Tailwind CSS come PostCSS plugin (non urgente)

### 2. Favicon 404
**Messaggio**: `Failed to load resource: the server responded with a status of 404 () @ /favicon.ico`

**Impatto**: Basso (cosmetica)

**Soluzione**: Favicon aggiunto come SVG inline (risolto)

### 3. JWT State contiene localhost
**Problema**: Nel JWT state di OAuth, `site_url` è `http://localhost:3000`

**Impatto**: Medio (potrebbe causare problemi nel redirect)

**Soluzione**: Verificare configurazione Supabase Dashboard

## 📊 Checklist Test Completa

- [ ] Login OAuth completo (Google)
- [ ] Login OAuth completo (Apple)
- [ ] Caricamento film da TMDB
- [ ] Swipe film (destro, sinistro, su)
- [ ] Salvataggio film nella playlist
- [ ] Visualizzazione playlist
- [ ] Rimozione film dalla playlist
- [ ] Creazione stanza
- [ ] Join stanza
- [ ] Lobby multiplayer
- [ ] Sessione multiplayer
- [ ] Match tra utenti
- [ ] Modifica profilo
- [ ] Upload avatar
- [ ] Statistiche utente
- [ ] Ricerca amici
- [ ] Invio richiesta amicizia
- [ ] Accettazione richiesta amicizia

## 🔧 Configurazione Richiesta

### Supabase
1. **URL Configuration**:
   - Site URL: `https://finder-sepia-ten.vercel.app`
   - Redirect URLs: `https://finder-sepia-ten.vercel.app`

2. **OAuth Providers**:
   - Google: Configurato ✅
   - Apple: Configurato ✅

### Vercel
1. **Environment Variables**:
   - `VITE_TMDB_ACCESS_TOKEN`: ✅
   - `VITE_SUPABASE_URL`: ✅
   - `VITE_SUPABASE_ANON_KEY`: ✅

## 📝 Note Finali

- L'app è **funzionante** e pronta per i test
- I problemi identificati sono **minori** e non bloccanti
- Per test completi, è necessario **autenticarsi** con un account reale
- Le funzionalità guest sono **limitate** (solo visualizzazione)

## 🚀 Prossimi Passi

1. Testare login completo con account reale
2. Testare tutte le funzionalità principali
3. Risolvere eventuali problemi trovati
4. Procedere con creazione APK Android

