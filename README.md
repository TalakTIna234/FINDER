<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MovieMatch - Tinder per Film

App per trovare il film perfetto da guardare con gli amici. Swipa i film, trova il match e crea stanze multiplayer per decidere insieme cosa guardare.

## Setup Locale

**Prerequisites:** Node.js 18+ e npm

1. **Installa le dipendenze:**
   ```bash
   npm install
   ```

2. **Configura le variabili d'ambiente:**
   
   Crea un file `.env` nella root del progetto (puoi copiare da `.env.example` se esiste):
   ```env
   VITE_TMDB_ACCESS_TOKEN=your_tmdb_token_here
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```
   
   Per ottenere il token TMDB:
   - Vai su https://www.themoviedb.org/settings/api
   - Crea un account e richiedi una API key
   - Copia il token nel file `.env`

3. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```
   
   L'app sarà disponibile su http://localhost:3000

## Build per Produzione

1. **Build dell'app:**
   ```bash
   npm run build
   ```
   
   I file compilati saranno nella cartella `dist/`

2. **Preview della build:**
   ```bash
   npm run preview
   ```

## Deploy

### Vercel

1. Installa Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Configura le environment variables nel dashboard Vercel:
   - `VITE_TMDB_ACCESS_TOKEN`
   - `VITE_GEMINI_API_KEY` (opzionale)

### Netlify

1. Installa Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Configura le environment variables nel dashboard Netlify

## Android

### Setup Capacitor

1. **Installa le dipendenze Capacitor:**
   ```bash
   npm install
   ```

2. **Sincronizza con Android:**
   ```bash
   npm run android:sync
   ```

3. **Apri il progetto in Android Studio:**
   ```bash
   npm run android:open
   ```

4. **Build completo:**
   ```bash
   npm run android:build
   ```

### Build APK

1. Apri il progetto in Android Studio
2. Vai su `Build > Generate Signed Bundle / APK`
3. Scegli APK
4. Crea un keystore (o usa debug per testing)
5. Build e installa sul dispositivo

## Environment Variables

| Variabile | Descrizione | Obbligatoria |
|-----------|-------------|--------------|
| `VITE_TMDB_ACCESS_TOKEN` | Token API per The Movie Database | Sì |
| `VITE_GEMINI_API_KEY` | Chiave API per Google Gemini (opzionale) | No |

## Funzionalità

- 🎬 **Swipe Cards**: Swipa i film come Tinder
- 🎯 **Match System**: Trova il film perfetto con eliminazione progressiva
- 👥 **Multiplayer Rooms**: Crea stanze e gioca con gli amici
- 📱 **Responsive**: Funziona su web e mobile
- 🌙 **Dark Mode**: Interfaccia scura elegante
- 🎥 **Trailer**: Guarda i trailer direttamente nell'app

## Troubleshooting

### Le immagini non caricano
- Verifica che il token TMDB sia corretto
- Controlla la console del browser per errori CORS
- Assicurati che `VITE_TMDB_ACCESS_TOKEN` sia configurato correttamente

### Errori di build
- Assicurati di avere Node.js 18+
- Rimuovi `node_modules` e `package-lock.json`, poi `npm install`
- Verifica che tutte le variabili d'ambiente siano configurate

### Problemi Android
- Assicurati di avere Android Studio installato
- Verifica che il progetto sia sincronizzato: `npm run android:sync`
- Controlla i log in Android Studio per errori specifici

## Tecnologie

- React 19
- TypeScript
- Vite
- Framer Motion
- Tailwind CSS
- Capacitor (Android)
- TMDB API

## Licenza

Progetto privato per beta testing.
