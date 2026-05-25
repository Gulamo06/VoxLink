import { supabase } from '../lib/supabase';
import { User } from '../types';
import { storageService } from './storageService';

interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  status: User['status'] | null;
  created_at: string;
}

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

function mapProfile(profile: ProfileRow): User {
  return {
    id: profile.id,
    username: profile.username,
    avatar: profile.avatar_url ?? undefined,
    status: profile.status ?? 'online',
    createdAt: profile.created_at
  };
}

export const profileService = {
  updateProfilePicture: async (currentUser: User, imageFile: File): Promise<User> => {
    if (!isSupabaseConfigured) {
      return {
        ...currentUser,
        avatar: URL.createObjectURL(imageFile)
      };
    }

    const avatarUrl = await storageService.uploadProfilePicture(imageFile, currentUser.id);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select('id, username, avatar_url, status, created_at')
      .single();

    if (error || !data) {
      throw error ?? new Error('Failed to update profile picture.');
    }

    return mapProfile(data as ProfileRow);
  }
};
