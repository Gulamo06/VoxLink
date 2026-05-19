import { create } from 'zustand';
import { User, PresenceStatus } from '../types';

interface ContactsState {
  contacts: User[];
  presence: Record<string, PresenceStatus>;
  addContact: (user: User) => void;
  removeContact: (id: string) => void;
  setPresence: (id: string, status: PresenceStatus) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  presence: {},
  addContact: (user) =>
    set((state) => ({
      contacts: state.contacts.some((contact) => contact.id === user.id)
        ? state.contacts
        : [...state.contacts, user]
    })),
  removeContact: (id) =>
    set((state) => ({ contacts: state.contacts.filter((contact) => contact.id !== id) })),
  setPresence: (id, status) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [id]: status
      }
    }))
}));
