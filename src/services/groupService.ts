import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Group, User } from '../types';

const MOCK_GROUPS: Group[] = [
  {
    id: 'room-1',
    name: 'General Lounge',
    members: [],
    channel: 'general-lounge'
  },
  {
    id: 'room-2',
    name: 'Music Room',
    members: [],
    channel: 'music-room'
  }
];

type GroupRow = {
  id: string;
  name: string;
  channel: string;
};

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function loadGroupsForUser(userId: string): Promise<Group[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (membershipsError) {
    throw membershipsError;
  }

  const groupIds = [...new Set((memberships ?? []).map((row) => row.group_id as string))];
  if (!groupIds.length) {
    return [];
  }

  const [{ data: groups, error: groupsError }, { data: memberRows, error: memberRowsError }] = await Promise.all([
    supabase.from('groups').select('id, name, channel').in('id', groupIds).order('name', { ascending: true }),
    supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds)
  ]);

  if (groupsError) {
    throw groupsError;
  }

  if (memberRowsError) {
    throw memberRowsError;
  }

  const memberIds = [...new Set((memberRows ?? []).map((row) => row.user_id as string))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, status, created_at')
    .in('id', memberIds);

  if (profilesError) {
    throw profilesError;
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, mapProfile(profile as ProfileRow)]));

  return (groups ?? []).map((group) => {
    const members = (memberRows ?? [])
      .filter((row) => row.group_id === group.id)
      .map((row) => profileMap.get(row.user_id as string))
      .filter((member): member is User => Boolean(member));

    return {
      id: group.id as string,
      name: group.name as string,
      channel: group.channel as string,
      members
    };
  });
}

export const groupService = {
  getGroups: async (): Promise<Group[]> => {
    if (!isSupabaseConfigured) {
      return MOCK_GROUPS;
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      return [];
    }

    return loadGroupsForUser(currentUser.id);
  },

  createGroup: async (name: string, memberIds: string[]): Promise<Group> => {
    if (!isSupabaseConfigured) {
      const group: Group = {
        id: `room-${Date.now()}`,
        name,
        members: [],
        channel: slugify(name)
      };
      MOCK_GROUPS.unshift(group);
      return group;
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to create a room.');
    }

    const channel = slugify(name);
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        channel,
        created_by: currentUser.id
      })
      .select('id, name, channel')
      .single();

    if (groupError || !group) {
      throw groupError ?? new Error('Unable to create room.');
    }

    const uniqueMemberIds = [...new Set([currentUser.id, ...memberIds])];
    const { error: membersError } = await supabase.from('group_members').upsert(
      uniqueMemberIds.map((memberId) => ({
        group_id: group.id,
        user_id: memberId
      })),
      { onConflict: 'group_id,user_id' }
    );

    if (membersError) {
      throw membersError;
    }

    const groups = await loadGroupsForUser(currentUser.id);
    const createdGroup = groups.find((entry) => entry.id === group.id);

    if (!createdGroup) {
      throw new Error('Room was created but could not be loaded.');
    }

    return createdGroup;
  },

  joinGroup: async (groupId: string): Promise<Group> => {
    if (!isSupabaseConfigured) {
      const group = MOCK_GROUPS.find((entry) => entry.id === groupId);
      if (group) {
        return group;
      }

      return {
        id: groupId,
        name: 'Unknown Room',
        members: [],
        channel: 'unknown'
      };
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to join a room.');
    }

    const { error } = await supabase.from('group_members').upsert(
      [{ group_id: groupId, user_id: currentUser.id }],
      { onConflict: 'group_id,user_id' }
    );

    if (error) {
      throw error;
    }

    const groups = await loadGroupsForUser(currentUser.id);
    const joinedGroup = groups.find((entry) => entry.id === groupId);

    if (!joinedGroup) {
      throw new Error('Unable to load room after joining.');
    }

    return joinedGroup;
  }
};
