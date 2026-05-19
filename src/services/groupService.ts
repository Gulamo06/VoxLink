import api from './api';
import { Group } from '../types';

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

export const groupService = {
  getGroups: async (): Promise<Group[]> => {
    if (import.meta.env.DEV) {
      return MOCK_GROUPS;
    }
    const response = await api.get<Group[]>('/groups');
    return response.data;
  },
  createGroup: async (name: string, memberIds: string[]): Promise<Group> => {
    if (import.meta.env.DEV) {
      const group: Group = {
        id: `room-${Date.now()}`,
        name,
        members: [],
        channel: name.toLowerCase().replace(/\s+/g, '-')
      };
      MOCK_GROUPS.push(group);
      return group;
    }
    const response = await api.post<Group>('/groups/create', { name, memberIds });
    return response.data;
  },
  joinGroup: async (groupId: string): Promise<Group> => {
    if (import.meta.env.DEV) {
      const group = MOCK_GROUPS.find((g) => g.id === groupId);
      if (group) return group;
      return { id: groupId, name: 'Unknown Room', members: [], channel: 'unknown' };
    }
    const response = await api.post<Group>('/groups/join', { groupId });
    return response.data;
  }
};
