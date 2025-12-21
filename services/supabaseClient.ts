
// Client Supabase per database e autenticazione
import { createClient } from '@supabase/supabase-js';

// Credenziali Supabase
// Carica da variabili d'ambiente, con fallback per sviluppo
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ghkfvvuqkexupwqshrtt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoa2Z2dnVxa2V4dXB3cXNocnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjQzMDMsImV4cCI6MjA4MTkwMDMwM30.ga9XCScsZloKJnzjOcTamTrU8IrkYV5K8oMTXw7Yhbs';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase credentials missing!');
}

// Configurazione per gestire meglio i cookie su desktop
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Usa PKCE per sicurezza migliore
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
});

// Tipi per il database
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email?: string;
          nickname: string;
          bio?: string;
          avatar_url?: string;
          provider: 'google' | 'apple' | 'email';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          nickname: string;
          bio?: string;
          avatar_url?: string;
          provider: 'google' | 'apple' | 'email';
        };
        Update: {
          nickname?: string;
          bio?: string;
          avatar_url?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Update: {
          status?: 'pending' | 'accepted' | 'blocked';
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          movie_data: any; // JSON con dati del film
          created_at: string;
        };
        Insert: {
          user_id: string;
          movie_id: number;
          movie_data: any;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          movies_liked: number;
          matches_found: number;
          rooms_created: number;
          rooms_joined: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          movies_liked?: number;
          matches_found?: number;
          rooms_created?: number;
          rooms_joined?: number;
        };
        Update: {
          movies_liked?: number;
          matches_found?: number;
          rooms_created?: number;
          rooms_joined?: number;
        };
      };
    };
  };
}

