
// Sistema di autenticazione con Supabase
import { supabase } from './supabaseClient';
import { profileService } from './profileService';
import { statsService } from './statsService';

export interface AuthUser {
  id: string;
  email?: string;
  nickname: string;
  avatar_url?: string;
  provider: 'google' | 'apple' | 'email';
}

class AuthService {
  // Sign in con email (per ora, poi aggiungiamo Google/Apple)
  async signInWithEmail(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in:', error);
      return null;
    }

    if (!data.user) return null;

    // Ottieni o crea profilo
    let profile = await profileService.getCurrentProfile();
    if (!profile) {
      profile = await profileService.upsertProfile({
        nickname: `User_${Math.floor(Math.random() * 1000)}`,
        email: data.user.email,
        provider: 'email'
      });
    }

    // Crea statistiche se non esistono
    await statsService.createStats(data.user.id);

    return profile ? {
      id: profile.id,
      email: profile.email,
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
      provider: profile.provider
    } : null;
  }

  // Sign up con email
  async signUpWithEmail(email: string, password: string, nickname: string): Promise<{ user: AuthUser | null; error: string | null }> {
    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { user: null, error: 'Email non valida' };
    }

    // Valida password (minimo 6 caratteri)
    if (!password || password.length < 6) {
      return { user: null, error: 'La password deve essere di almeno 6 caratteri' };
    }

    // Valida nickname
    if (!nickname || nickname.length < 2) {
      return { user: null, error: 'Il nickname deve essere di almeno 2 caratteri' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('Error signing up:', error);
      
      // Se l'email è già registrata, suggerisci il login
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        return { user: null, error: 'EMAIL_EXISTS' };
      }
      
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Failed to create user' };
    }

    // IMPORTANTE: Se l'email non è confermata, Supabase non crea una sessione attiva
    // Non possiamo creare il profilo ora perché richiede autenticazione
    // Il profilo verrà creato quando l'utente conferma l'email e fa login
    
    // Verifica se l'email è già confermata (raro, ma possibile se auto-confirm è attivo)
    if (data.session && data.user.email_confirmed_at) {
      // Email già confermata - crea profilo e statistiche
      const profile = await profileService.upsertProfile({
        nickname,
        email: data.user.email,
        provider: 'email'
      });

      if (profile) {
        await statsService.createStats(data.user.id);
        
        return {
          user: {
            id: profile.id,
            email: profile.email,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            provider: profile.provider
          },
          error: null
        };
      }
    }

    // Email non confermata - l'utente deve confermare prima di poter accedere
    // Il profilo verrà creato al primo login dopo la conferma
    return {
      user: null,
      error: null // Nessun errore, ma l'utente deve confermare l'email
    };
  }

  // Sign in con Google (OAuth reale)
  async signInWithGoogle(): Promise<AuthUser | null> {
    try {
      // Ottieni l'URL corretto (Vercel o locale)
      const redirectUrl = window.location.origin;
      
      console.log('Google OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        return null;
      }

      // OAuth reindirizza l'utente, quindi non possiamo ritornare l'utente qui
      // L'utente verrà gestito nel callback
      return null;
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      return null;
    }
  }

  // Sign in con Apple (OAuth reale)
  async signInWithApple(): Promise<AuthUser | null> {
    try {
      // Ottieni l'URL corretto (Vercel o locale)
      const redirectUrl = window.location.origin;
      
      console.log('Apple OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Error signing in with Apple:', error);
        return null;
      }

      // OAuth reindirizza l'utente, quindi non possiamo ritornare l'utente qui
      // L'utente verrà gestito nel callback
      return null;
    } catch (error) {
      console.error('Error in signInWithApple:', error);
      return null;
    }
  }

  // Ottieni utente corrente
  async getCurrentUser(): Promise<AuthUser | null> {
    // Prova prima con getSession (più affidabile dopo OAuth redirect)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
    }
    
    // Se abbiamo una sessione, usa quella, altrimenti prova getUser
    const { data: { user }, error: userError } = session?.user 
      ? { data: { user: session.user }, error: null }
      : await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
    }
    
    if (!user) {
      console.log('No user found in session or getUser');
      return null;
    }

    let profile = await profileService.getCurrentProfile();
    
    // Se non esiste profilo, crealo (utente OAuth appena registrato)
    if (!profile) {
      try {
        const provider = user.app_metadata?.provider as 'google' | 'apple' | 'email' || 'email';
        const nickname = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         `User_${Math.floor(Math.random() * 1000)}`;
        
        console.log('Creating profile for OAuth user:', { provider, nickname, email: user.email });
        
        profile = await profileService.upsertProfile({
          nickname,
          email: user.email,
          provider: provider === 'google' ? 'google' : provider === 'apple' ? 'apple' : 'email'
        });
        
        if (!profile) {
          console.error('Failed to create profile after OAuth');
          return null;
        }
        
        // Crea statistiche iniziali
        try {
          await statsService.createStats(user.id);
        } catch (statsError) {
          console.warn('Error creating stats (non-critical):', statsError);
        }
      } catch (error) {
        console.error('Error creating profile after OAuth:', error);
        return null;
      }
    }

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
      provider: profile.provider
    };
  }

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Verifica se è autenticato
  async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  }

  // Listener per cambiamenti auth
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await profileService.getCurrentProfile();
        if (profile) {
          callback({
            id: profile.id,
            email: profile.email,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            provider: profile.provider
          });
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
