import api from './api';
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

export const contactService = {
  getContacts: async (): Promise<User[]> => {
    if (import.meta.env.DEV) {
      return MOCK_CONTACTS;
    }
    const response = await api.get<User[]>('/contacts');
    return response.data;
  },
  addContact: async (payload: { username?: string; deepLink?: string }): Promise<User> => {
    if (import.meta.env.DEV) {
      const newContact: User = {
        id: `contact-${Date.now()}`,
        username: payload.username ?? payload.deepLink?.split('/').pop() ?? 'unknown',
        status: 'online',
        createdAt: new Date().toISOString()
      };
      MOCK_CONTACTS.push(newContact);
      return newContact;
    }
    const response = await api.post<User>('/contacts/add', payload);
    return response.data;
  },
  removeContact: async (id: string) => {
    if (import.meta.env.DEV) {
      const idx = MOCK_CONTACTS.findIndex((c) => c.id === id);
      if (idx !== -1) MOCK_CONTACTS.splice(idx, 1);
      return { success: true };
    }
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  }
};
