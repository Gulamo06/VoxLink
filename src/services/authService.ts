import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function makeMock(username: string): AuthResponse {
  const user: User = {
    id: `local-${Date.now()}`,
    username,
    status: 'online',
    createdAt: new Date().toISOString()
  };
  return {
    user,
    accessToken: `local-token-${Math.random().toString(36).slice(2)}`,
    refreshToken: `local-refresh-${Math.random().toString(36).slice(2)}`
  };
}

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const authService = {
  login: async (username: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) return makeMock(username);

    // Look up existing profile by username
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) {
      // Username not found — register instead
      return authService.register(username);
    }

    // Sign in anonymously and attach profile
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) return makeMock(username);

    const user: User = {
      id: profile.id,
      username: profile.username,
      avatar: profile.avatar_url ?? undefined,
      status: 'online',
      createdAt: profile.created_at
    };

    return {
      user,
      accessToken: anonData.session?.access_token ?? '',
      refreshToken: anonData.session?.refresh_token ?? ''
    };
  },

  register: async (username: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) return makeMock(username);

    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) return makeMock(username);

    const authId = anonData.user?.id ?? `local-${Date.now()}`;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .insert({ id: authId, username, status: 'online' })
      .select()
      .single();

    if (profileErr || !profile) return makeMock(username);

    const user: User = {
      id: profile.id,
      username: profile.username,
      avatar: profile.avatar_url ?? undefined,
      status: 'online',
      createdAt: profile.created_at
    };

    return {
      user,
      accessToken: anonData.session?.access_token ?? '',
      refreshToken: anonData.session?.refresh_token ?? ''
    };
  },

  refresh: async (_refreshToken: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) return makeMock('guest');
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return makeMock('guest');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
    if (!profile) return makeMock('guest');
    return {
      user: {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar_url ?? undefined,
        status: 'online',
        createdAt: profile.created_at
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  }
};
