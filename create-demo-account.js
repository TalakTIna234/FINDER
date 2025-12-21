// Script Node.js per creare l'account demo
// Esegui: node create-demo-account.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica variabili d'ambiente
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ghkfvvuqkexupwqshrtt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Errore: SUPABASE_SERVICE_ROLE_KEY non trovata nelle variabili d\'ambiente.');
  console.log('\nPer ottenere la Service Role Key:');
  console.log('1. Vai su Supabase Dashboard → Settings → API');
  console.log('2. Copia la "service_role" key (secret, non l\'anon key)');
  console.log('3. Aggiungila al file .env come: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('\nOppure esegui questo script con:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_key node create-demo-account.js');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoAccount() {
  console.log('🎬 Creazione account demo...\n');
  
  try {
    // 1. Verifica se l'utente esiste già
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingUser = existingUsers.users.find(u => u.email === 'demo@moviematch.app');
    
    let userId;
    
    if (existingUser) {
      console.log('ℹ️  Utente demo già esistente, aggiorno...');
      userId = existingUser.id;
    } else {
      // 2. Crea nuovo utente
      console.log('📝 Creazione nuovo utente...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'demo@moviematch.app',
        password: 'demo',
        email_confirm: true,
        user_metadata: {
          nickname: 'Demo User'
        }
      });
      
      if (authError) throw authError;
      userId = authData.user.id;
      console.log('✅ Utente creato:', userId);
    }
    
    // 3. Crea/aggiorna profilo
    console.log('👤 Creazione profilo...');
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: 'demo@moviematch.app',
        nickname: 'Demo User',
        provider: 'email',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (profileError) throw profileError;
    console.log('✅ Profilo creato/aggiornato');
    
    // 4. Crea statistiche iniziali
    console.log('📊 Creazione statistiche...');
    const { error: statsError } = await supabaseAdmin
      .from('user_stats')
      .upsert({
        user_id: userId,
        movies_liked: 0,
        matches_found: 0,
        rooms_created: 0,
        rooms_joined: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (statsError && !statsError.message.includes('duplicate')) {
      console.warn('⚠️  Warning statistiche:', statsError.message);
    } else {
      console.log('✅ Statistiche create');
    }
    
    console.log('\n🎉 Account demo creato con successo!');
    console.log('\n📋 Credenziali:');
    console.log('   Email: demo@moviematch.app');
    console.log('   Password: demo');
    console.log('\n✅ Ora puoi testare il login nell\'app!');
    
  } catch (error) {
    console.error('\n❌ Errore durante la creazione:', error.message);
    if (error.details) console.error('Dettagli:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

createDemoAccount();

