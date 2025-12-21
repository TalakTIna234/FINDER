
// Servizio per statistiche utente
import { supabase } from './supabaseClient';

export interface UserStats {
  id: string;
  user_id: string;
  movies_liked: number;
  matches_found: number;
  rooms_created: number;
  rooms_joined: number;
  updated_at: string;
}

export const statsService = {
  // Ottieni statistiche utente
  async getStats(userId?: string): Promise<UserStats | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      // Se non esiste, crea record iniziale
      if (error.code === 'PGRST116') {
        return await this.createStats(targetUserId);
      }
      console.error('Error fetching stats:', error);
      return null;
    }

    return data as UserStats;
  },

  // Crea record statistiche iniziale
  async createStats(userId: string): Promise<UserStats | null> {
    // Verifica autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      console.warn('User not authenticated, skipping stats creation');
      return null;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        movies_liked: 0,
        matches_found: 0,
        rooms_created: 0,
        rooms_joined: 0
      })
      .select()
      .single();

    if (error) {
      // Se esiste già, ritorna quello esistente
      if (error.code === '23505') {
        return await this.getStats(userId);
      }
      console.error('Error creating stats:', error);
      return null;
    }

    return data as UserStats;
  },

  // Incrementa contatore
  async increment(field: 'movies_liked' | 'matches_found' | 'rooms_created' | 'rooms_joined', amount: number = 1): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Assicurati che esista il record
    let stats = await this.getStats();
    if (!stats) {
      stats = await this.createStats(user.id);
      if (!stats) return false;
    }

    const { error } = await supabase.rpc('increment_stats', {
      user_id_param: user.id,
      field_name: field,
      increment_value: amount
    });

    // Se la funzione RPC non esiste, usa update normale
    if (error && error.code === '42883') {
      const currentValue = stats[field] || 0;
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ [field]: currentValue + amount })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error incrementing stats:', updateError);
        return false;
      }
      return true;
    }

    if (error) {
      console.error('Error incrementing stats:', error);
      return false;
    }

    return true;
  },

  // Aggiorna statistiche manualmente
  async updateStats(updates: Partial<Omit<UserStats, 'id' | 'user_id' | 'updated_at'>>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Assicurati che esista il record
    let stats = await this.getStats();
    if (!stats) {
      stats = await this.createStats(user.id);
      if (!stats) return false;
    }

    const { error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating stats:', error);
      return false;
    }

    return true;
  }
};

