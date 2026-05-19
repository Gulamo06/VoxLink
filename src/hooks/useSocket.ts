import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useContactsStore } from '../store/useContactsStore';
import { useChatStore } from '../store/useChatStore';
import { Message, User } from '../types';

export function useSocket() {
  const { currentUser } = useAuthStore();
  const addMessage = useChatStore((state) => state.addMessage);
  const setPresence = useContactsStore((state) => state.setPresence);
  const addContact = useContactsStore((state) => state.addContact);

  const socket = useMemo<Socket | null>(() => {
    if (!currentUser || import.meta.env.DEV) return null;
    return io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000', {
      auth: { token: currentUser.id }
    });
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      socket.emit('user:online', currentUser);
    });

    socket.on('user:online', (user: User) => setPresence(user.id, 'online'));
    socket.on('user:offline', (user: User) => setPresence(user.id, 'offline'));
    socket.on('message:new', (message: Message) => addMessage(message));
    socket.on('contact:add', (user: User) => addContact(user));

    return () => {
      socket.disconnect();
    };
  }, [socket, currentUser, addMessage, addContact, setPresence]);

  return socket;
}
