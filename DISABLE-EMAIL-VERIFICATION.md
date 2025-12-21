# 🔧 Disabilita Verifica Email per Test

## ⚡ Quick Fix

Per testare senza dover confermare l'email:

1. **Vai su Supabase Dashboard**
   - https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Vai su Settings → Auth**
   - Menu laterale → **Settings** → **Auth**

3. **Disabilita Email Confirmations**
   - Scorri fino a **Email Auth**
   - **Disabilita** "Enable email confirmations"
   - Clicca **Save**

4. **Ricarica l'App**
   - Ricarica https://finder-sepia-ten.vercel.app
   - Prova a registrarti di nuovo

## ✅ Risultato

Dopo aver disabilitato la verifica email:
- ✅ Le registrazioni creeranno sessioni attive immediatamente
- ✅ Non serve confermare l'email
- ✅ Puoi testare subito tutte le funzionalità

## ⚠️ Nota

Questo è solo per **test/sviluppo**. In produzione, mantieni la verifica email attiva per sicurezza.

## 📧 Per Produzione

Quando sei pronto per la produzione:
1. **Configura SMTP** in Supabase per inviare email reali
2. **Riabilita** "Enable email confirmations"
3. **Personalizza** i template email

