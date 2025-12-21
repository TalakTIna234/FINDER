
// Servizio per gestione amici
import { supabase } from './supabaseClient';
import { profileService, UserProfile } from './profileService';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile?: UserProfile;
}

export const friendsService = {
  // Invia richiesta di amicizia
  async sendFriendRequest(friendId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id === friendId) return false;

    // Verifica se esiste già una richiesta
    const { data: existing } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single();

    if (existing) {
      // Se esiste già, aggiorna lo status se necessario
      if (existing.status === 'blocked') return false;
      return true; // Richiesta già esistente
    }

    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending friend request:', error);
      return false;
    }

    return true;
  },

  // Accetta richiesta di amicizia
  async acceptFriendRequest(friendId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }

    return true;
  },

  // Rifiuta/rimuovi amicizia
  async removeFriend(friendId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) {
      console.error('Error removing friend:', error);
      return false;
    }

    return true;
  },

  // Ottieni lista amici accettati
  async getFriends(): Promise<UserProfile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friends')
      .select('friend_id, user_id')
      .or(`and(user_id.eq.${user.id},status.eq.accepted),and(friend_id.eq.${user.id},status.eq.accepted)`);

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    // Estrai gli ID degli amici
    const friendIds = data.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    // Ottieni i profili
    const profiles = await Promise.all(
      friendIds.map(id => profileService.getProfile(id))
    );

    return profiles.filter(p => p !== null) as UserProfile[];
  },

  // Ottieni richieste in sospeso (ricevute)
  async getPendingRequests(): Promise<Friend[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }

    // Aggiungi profili
    const friendsWithProfiles = await Promise.all(
      data.map(async (f) => {
        const profile = await profileService.getProfile(f.user_id);
        return { ...f, friend_profile: profile } as Friend;
      })
    );

    return friendsWithProfiles.filter(f => f.friend_profile !== null);
  },

  // Verifica se due utenti sono amici
  async areFriends(friendId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId},status.eq.accepted),and(user_id.eq.${friendId},friend_id.eq.${user.id},status.eq.accepted)`)
      .single();

    return data !== null;
  },

  // Verifica status amicizia
  async getFriendshipStatus(friendId: string): Promise<'none' | 'pending' | 'accepted' | 'blocked'> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'none';

    const { data } = await supabase
      .from('friends')
      .select('status, user_id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single();

    if (!data) return 'none';

    // Se la richiesta è stata inviata da noi, ritorna pending
    // Se è stata ricevuta, ritorna accepted se accettata
    if (data.user_id === user.id) {
      return data.status as 'pending' | 'accepted' | 'blocked';
    } else {
      return data.status === 'accepted' ? 'accepted' : 'pending';
    }
  }
};

