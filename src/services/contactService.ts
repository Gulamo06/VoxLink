import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { User } from '../types';

const MOCK_CONTACTS: User[] = [
  {
    id: 'contact-1',
    username: 'alice',
    status: 'online',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'contact-2',
    username: 'bob',
    status: 'busy',
    createdAt: '2025-01-02T00:00:00.000Z'
  },
  {
    id: 'contact-3',
    username: 'charlie',
    status: 'offline',
    createdAt: '2025-02-15T00:00:00.000Z'
  }
];

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  status: User['status'] | null;
  created_at: string;
};

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

function parseDeepLink(deepLink: string): { userId?: string; username?: string } {
  const trimmed = deepLink.trim();

  if (trimmed.startsWith('voxlink://user/')) {
    return { userId: decodeURIComponent(trimmed.replace('voxlink://user/', '')) };
  }

  // Parse standard HTTP/HTTPS web invite links
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const inviteId = url.searchParams.get('invite');
      if (inviteId) {
        return { userId: inviteId };
      }

      if (url.pathname.startsWith('/user/')) {
        return { userId: decodeURIComponent(url.pathname.replace('/user/', '')) };
      }
    } catch {
      // Ignore URL parsing exceptions
    }
  }

  try {
    const parsed = JSON.parse(trimmed) as { type?: string; userId?: string };
    if (parsed.type === 'voxlink' && parsed.userId) {
      return { userId: parsed.userId };
    }
  } catch {
    // Ignore invalid JSON and treat the value as a plain username.
  }

  return { username: trimmed };
}

async function lookupProfile(payload: { username?: string; deepLink?: string }): Promise<ProfileRow> {
  const resolved = payload.deepLink ? parseDeepLink(payload.deepLink) : { username: payload.username?.trim() };

  if (resolved.userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, status, created_at')
      .eq('id', resolved.userId)
      .single();

    if (error || !data) {
      throw new Error('Contact not found.');
    }

    return data as ProfileRow;
  }

  if (!resolved.username) {
    throw new Error('Please enter a username or VoxLink invite.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, status, created_at')
    .eq('username', resolved.username)
    .single();

  if (error || !data) {
    throw new Error('Contact not found.');
  }

  return data as ProfileRow;
}

export const contactService = {
  getContacts: async (): Promise<User[]> => {
    if (!isSupabaseConfigured) {
      return MOCK_CONTACTS;
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      return [];
    }

    const { data: contactRows, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('owner_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (contactsError) {
      throw contactsError;
    }

    const contactIds = (contactRows ?? []).map((row) => row.contact_id as string);
    if (!contactIds.length) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, status, created_at')
      .in('id', contactIds);

    if (profilesError) {
      throw profilesError;
    }

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, mapProfile(profile as ProfileRow)]));

    return contactIds
      .map((contactId) => profileMap.get(contactId))
      .filter((contact): contact is User => Boolean(contact));
  },

  addContact: async (payload: { username?: string; deepLink?: string }): Promise<User> => {
    if (!isSupabaseConfigured) {
      const newContact: User = {
        id: `contact-${Date.now()}`,
        username: payload.username ?? payload.deepLink?.split('/').pop() ?? 'unknown',
        status: 'online',
        createdAt: new Date().toISOString()
      };
      MOCK_CONTACTS.push(newContact);
      return newContact;
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to add contacts.');
    }

    const profile = await lookupProfile(payload);

    if (profile.id === currentUser.id) {
      throw new Error('You cannot add yourself as a contact.');
    }

    const { error } = await supabase.from('contacts').upsert(
      [
        { owner_id: currentUser.id, contact_id: profile.id },
        { owner_id: profile.id, contact_id: currentUser.id }
      ],
      { onConflict: 'owner_id,contact_id' }
    );

    if (error) {
      throw error;
    }

    return mapProfile(profile);
  },

  removeContact: async (id: string) => {
    if (!isSupabaseConfigured) {
      const idx = MOCK_CONTACTS.findIndex((contact) => contact.id === id);
      if (idx !== -1) {
        MOCK_CONTACTS.splice(idx, 1);
      }
      return { success: true };
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to remove contacts.');
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('owner_id', currentUser.id)
      .eq('contact_id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }
};
