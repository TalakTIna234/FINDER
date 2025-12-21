# ✅ Checklist Test MovieMatch

## 🎯 Test da Eseguire Prima dell'APK

### 1. 🔐 Autenticazione

#### 1.1 Login con Google
- [ ] Vai su **Profilo**
- [ ] Clicca **Accedi con Google**
- [ ] Completa il login su Google
- [ ] Verifica redirect all'app
- [ ] Verifica che il profilo mostri nickname e avatar
- [ ] Verifica che lo stato passi da "Limitato" a "Premium"

#### 1.2 Login con Apple
- [ ] Vai su **Profilo**
- [ ] Clicca **Accedi con Apple**
- [ ] Completa il login su Apple
- [ ] Verifica redirect all'app
- [ ] Verifica che il profilo mostri nickname e avatar

#### 1.3 Registrazione con Email
- [ ] Vai su **Profilo**
- [ ] Clicca **Accedi con Email**
- [ ] Clicca **Non hai un account? Registrati**
- [ ] Compila: Nickname, Email, Password
- [ ] Clicca **Registrati**
- [ ] Verifica messaggio di successo
- [ ] Controlla email per conferma (se richiesta)
- [ ] Verifica che il profilo sia stato creato

#### 1.4 Login con Email
- [ ] Vai su **Profilo**
- [ ] Clicca **Accedi con Email**
- [ ] Inserisci email e password
- [ ] Clicca **Accedi**
- [ ] Verifica login riuscito
- [ ] Verifica che il profilo mostri i dati corretti

#### 1.5 Logout
- [ ] Essere loggato
- [ ] Vai su **Profilo**
- [ ] Clicca **Esci dall'account**
- [ ] Verifica che torni a guest mode
- [ ] Verifica che le funzionalità premium siano bloccate

---

### 2. 🎬 Film e Swipe

#### 2.1 Caricamento Film (Solo Premium)
- [ ] Essere loggato
- [ ] Vai su **Home**
- [ ] Clicca **Crea Stanza**
- [ ] Seleziona un genere
- [ ] Verifica che i film si carichino
- [ ] Verifica che le card dei film siano visibili
- [ ] Verifica che le immagini dei poster si carichino

#### 2.2 Swipe Film
- [ ] Essere in una sessione con film
- [ ] Swipe a destra (like) su un film
- [ ] Verifica animazione di swipe
- [ ] Verifica che il film successivo appaia
- [ ] Swipe a sinistra (pass) su un film
- [ ] Verifica animazione di swipe
- [ ] Verifica che il film successivo appaia

#### 2.3 Salvataggio in Playlist
- [ ] Swipe a destra (like) su alcuni film
- [ ] Vai su **Match** (tab playlist)
- [ ] Verifica che i film salvati siano nella playlist
- [ ] Verifica che le immagini dei poster siano visibili
- [ ] Verifica che i dettagli del film siano corretti

#### 2.4 Rimozione da Playlist
- [ ] Vai su **Match**
- [ ] Se ci sono film salvati, clicca per rimuoverli
- [ ] Verifica che il film venga rimosso
- [ ] Verifica che la playlist si aggiorni

---

### 3. 🎮 Stanze Multiplayer

#### 3.1 Creazione Stanza
- [ ] Essere loggato
- [ ] Vai su **Home**
- [ ] Clicca **Crea Stanza**
- [ ] Seleziona un genere
- [ ] Verifica che la stanza venga creata
- [ ] Verifica che il codice stanza sia visibile (6 caratteri)
- [ ] Verifica che si entri nella lobby

#### 3.2 Lobby - Visualizzazione
- [ ] Essere in una lobby
- [ ] Verifica che l'host sia visibile nella lista membri
- [ ] Verifica che il codice stanza sia visibile
- [ ] Verifica che ci sia un pulsante per condividere il codice

#### 3.3 Join Stanza (Stesso Dispositivo)
- [ ] Apri un'altra scheda/incognito
- [ ] Loggati con un altro account
- [ ] Vai su **Home**
- [ ] Clicca **Entra**
- [ ] Inserisci il codice stanza (6 caratteri)
- [ ] Clicca **Entra in Stanza**
- [ ] Verifica che entri nella lobby
- [ ] Verifica che entrambi i membri siano visibili

#### 3.4 Join Stanza (Dispositivo Diverso)
- [ ] Crea una stanza da PC
- [ ] Copia il codice stanza
- [ ] Apri l'app su mobile (o altro dispositivo)
- [ ] Loggati
- [ ] Vai su **Home** → **Entra**
- [ ] Inserisci il codice
- [ ] Verifica che entri nella lobby
- [ ] Verifica che entrambi i membri siano visibili in tempo reale

#### 3.5 Avvio Sessione
- [ ] Essere in una lobby con almeno 2 membri
- [ ] Verifica che tutti i membri siano "ready"
- [ ] L'host clicca per avviare
- [ ] Verifica che la sessione inizi
- [ ] Verifica che i film appaiano per tutti i membri

#### 3.6 Condivisione Codice
- [ ] Essere in una lobby
- [ ] Clicca per condividere il codice
- [ ] Verifica che il codice sia copiato/condiviso
- [ ] Verifica che il formato sia corretto

---

### 4. 👥 Sistema Amici

#### 4.1 Ricerca Utenti
- [ ] Essere loggato
- [ ] Vai su **Profilo**
- [ ] Scorri fino a "Aggiungi Amici"
- [ ] Inserisci un nickname nella ricerca
- [ ] Verifica che i risultati appaiano
- [ ] Verifica che il tuo account non appaia nei risultati

#### 4.2 Invio Richiesta Amicizia
- [ ] Cerca un utente
- [ ] Clicca il pulsante per aggiungere
- [ ] Verifica che la richiesta venga inviata
- [ ] Verifica feedback visivo

#### 4.3 Accettazione Richiesta
- [ ] Loggati con l'altro account
- [ ] Vai su **Profilo**
- [ ] Verifica che ci sia una notifica/richiesta pendente
- [ ] Accetta la richiesta
- [ ] Verifica che l'amicizia sia attiva

#### 4.4 Lista Amici
- [ ] Essere loggato con amici
- [ ] Vai su **Profilo**
- [ ] Verifica che gli amici siano visibili
- [ ] Verifica che i nickname e avatar siano corretti

---

### 5. 👤 Profilo

#### 5.1 Modifica Nickname
- [ ] Essere loggato
- [ ] Vai su **Profilo**
- [ ] Modifica il nickname
- [ ] Esci dal campo (blur)
- [ ] Verifica che il nickname venga salvato
- [ ] Ricarica la pagina
- [ ] Verifica che il nickname sia persistito

#### 5.2 Modifica Bio
- [ ] Essere loggato
- [ ] Vai su **Profilo**
- [ ] Modifica la bio
- [ ] Esci dal campo (blur)
- [ ] Verifica che la bio venga salvata
- [ ] Ricarica la pagina
- [ ] Verifica che la bio sia persistita

#### 5.3 Upload Avatar
- [ ] Essere loggato
- [ ] Vai su **Profilo**
- [ ] Clicca per caricare un avatar
- [ ] Seleziona un'immagine
- [ ] Verifica che l'immagine venga caricata
- [ ] Verifica che l'avatar appaia nel profilo
- [ ] Verifica che l'avatar appaia nella lista amici

#### 5.4 Statistiche
- [ ] Essere loggato
- [ ] Vai su **Profilo**
- [ ] Verifica che le statistiche siano visibili:
  - Film Salvati
  - Match Trovati
  - Stanze Create
- [ ] Verifica che i numeri siano corretti

---

### 6. 🔄 Persistenza Dati

#### 6.1 Persistenza Login
- [ ] Effettua login
- [ ] Chiudi il browser/app
- [ ] Riapri l'app
- [ ] Verifica che rimani loggato
- [ ] Verifica che i dati del profilo siano caricati

#### 6.2 Persistenza Playlist
- [ ] Salva alcuni film nella playlist
- [ ] Chiudi l'app
- [ ] Riapri l'app
- [ ] Vai su **Match**
- [ ] Verifica che i film siano ancora nella playlist

#### 6.3 Persistenza Profilo
- [ ] Modifica nickname e bio
- [ ] Chiudi l'app
- [ ] Riapri l'app
- [ ] Vai su **Profilo**
- [ ] Verifica che nickname e bio siano salvati

---

### 7. 🐛 Test Errori e Edge Cases

#### 7.1 Codice Stanza Non Valido
- [ ] Vai su **Home** → **Entra**
- [ ] Inserisci un codice non esistente
- [ ] Clicca **Entra in Stanza**
- [ ] Verifica messaggio di errore chiaro

#### 7.2 Codice Stanza Troppo Corto
- [ ] Vai su **Home** → **Entra**
- [ ] Inserisci meno di 6 caratteri
- [ ] Verifica che il pulsante sia disabilitato

#### 7.3 Login con Credenziali Errate
- [ ] Vai su **Profilo** → **Accedi con Email**
- [ ] Inserisci email/password errate
- [ ] Clicca **Accedi**
- [ ] Verifica messaggio di errore chiaro

#### 7.4 Registrazione Email Esistente
- [ ] Prova a registrarti con un'email già usata
- [ ] Verifica messaggio di errore chiaro

#### 7.5 Accesso Funzionalità Premium da Guest
- [ ] Essere in guest mode
- [ ] Prova a creare una stanza
- [ ] Verifica che sia bloccato
- [ ] Verifica messaggio "Registrati per sbloccare"

---

### 8. 📱 Test Responsive

#### 8.1 Desktop
- [ ] Verifica che l'app funzioni su desktop
- [ ] Verifica che il layout sia corretto
- [ ] Verifica che tutti i pulsanti siano cliccabili

#### 8.2 Mobile
- [ ] Apri l'app su mobile
- [ ] Verifica che il layout sia responsive
- [ ] Verifica che lo swipe funzioni su touch
- [ ] Verifica che tutti i pulsanti siano tappabili
- [ ] Verifica che la navigazione funzioni

---

## 📊 Risultati Test

### ✅ Test Completati
- [ ] Autenticazione Google
- [ ] Autenticazione Apple
- [ ] Autenticazione Email
- [ ] Swipe film
- [ ] Playlist
- [ ] Creazione stanze
- [ ] Join stanze
- [ ] Sistema amici
- [ ] Modifica profilo
- [ ] Persistenza dati

### ❌ Test Falliti
- [ ] (Lista problemi trovati)

### ⚠️ Problemi Noti
- [ ] (Lista problemi da risolvere)

---

## 🚀 Pronto per APK?

Prima di creare l'APK, assicurati che:
- [ ] Tutti i test critici siano passati
- [ ] Non ci siano errori in console
- [ ] L'app funzioni su mobile
- [ ] Le funzionalità multiplayer funzionino tra dispositivi
- [ ] I dati persistano correttamente

