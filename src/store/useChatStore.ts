import { create } from 'zustand';
import { Message } from '../types';

interface ChatState {
  messages: Record<string, Message[]>;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markRead: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  setMessages: (chatId, messages) => set((state) => ({ messages: { ...state.messages, [chatId]: messages } })),
  addMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.chatId]: [...(state.messages[message.chatId] ?? []), message]
      }
    })),
  markRead: (chatId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.map((message) => ({ ...message, read: true })) ?? []
      }
    }))
}));
