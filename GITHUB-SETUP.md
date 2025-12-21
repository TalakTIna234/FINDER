# Setup GitHub Repository - Step by Step

## Step 1: Crea Repository su GitHub

1. Vai su https://github.com/new
2. **Repository name**: `moviematch` (o un nome a tua scelta)
3. **Description**: (opzionale) "Tinder per Film - MovieMatch App"
4. **Visibility**: 
   - ✅ **Public** (consigliato per Vercel gratuito)
   - ⬜ Private
5. **NON** spuntare:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Clicca **Create repository**

## Step 2: Copia l'URL del Repository

Dopo aver creato il repository, GitHub ti mostrerà una pagina con istruzioni. 

**Copia l'URL HTTPS** (dovrebbe essere tipo):
```
https://github.com/TUO_USERNAME/moviematch.git
```

## Step 3: Collega il Repository Locale a GitHub

Torna qui e dimmi l'URL del repository, oppure esegui questi comandi nel terminale:

```bash
git remote add origin https://github.com/TUO_USERNAME/moviematch.git
git branch -M main
git push -u origin main
```

## Step 4: Verifica

Vai su https://github.com/TUO_USERNAME/moviematch e dovresti vedere tutti i file del progetto!

## Prossimo Step: Deploy su Vercel

Dopo aver fatto il push su GitHub, procederemo con il deploy su Vercel.

