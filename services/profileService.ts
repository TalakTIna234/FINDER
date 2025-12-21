
// Servizio per gestione profilo utente
import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email?: string;
  nickname: string;
  bio?: string;
  avatar_url?: string;
  provider: 'google' | 'apple' | 'email';
  created_at: string;
  updated_at: string;
}

export const profileService = {
  // Ottieni profilo utente corrente
  async getCurrentProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  // Ottieni profilo per ID
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  // Crea o aggiorna profilo
  async upsertProfile(profile: {
    nickname: string;
    bio?: string;
    email?: string;
    provider: 'google' | 'apple' | 'email';
  }): Promise<UserProfile | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      return null;
    }
    if (!user) {
      console.error('No user found');
      return null;
    }

    console.log('Upserting profile:', { userId: user.id, nickname: profile.nickname, provider: profile.provider });

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: profile.email || user.email,
        nickname: profile.nickname,
        bio: profile.bio || null,
        provider: profile.provider,
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return null;
    }

    console.log('Profile created/updated successfully:', data);
    return data as UserProfile;
  },

  // Aggiorna solo nickname e bio
  async updateProfile(updates: {
    nickname?: string;
    bio?: string;
  }): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  // Aggiorna avatar URL
  async updateAvatar(avatarUrl: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating avatar:', error);
      return false;
    }

    return true;
  },

  // Cerca utenti per nickname
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('nickname', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data as UserProfile[];
  }
};

