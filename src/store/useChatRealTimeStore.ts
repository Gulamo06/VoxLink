import { create } from 'zustand';
import { SocketMessage } from '../services/socketService';

export interface ChatWithMessages {
  id: string;
  name?: string;
  messages: SocketMessage[];
  typingUsers: Set<string>;
  onlineUsers: number;
  lastMessage?: SocketMessage;
  unreadCount: number;
}

interface ChatStore {
  // Chats state
  chats: Map<string, ChatWithMessages>;
  activeChat: string | null;
  
  // Actions
  initializeChat: (chatId: string) => void;
  addMessage: (chatId: string, message: SocketMessage) => void;
  setActiveChat: (chatId: string | null) => void;
  clearChatMessages: (chatId: string) => void;
  
  // Typing indicators
  setTypingUser: (chatId: string, userId: string, isTyping: boolean, userName?: string) => void;
  
  // Online users
  setOnlineUsers: (chatId: string, count: number) => void;
  
  // Unread messages
  markMessageAsRead: (chatId: string, messageId: string) => void;
  incrementUnread: (chatId: string) => void;
  clearUnread: (chatId: string) => void;
  
  // Get functions
  getChat: (chatId: string) => ChatWithMessages | undefined;
  getMessages: (chatId: string) => SocketMessage[];
  getTypingUsers: (chatId: string) => string[];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: new Map(),
  activeChat: null,

  initializeChat: (chatId: string) => {
    set((state) => {
      if (!state.chats.has(chatId)) {
        state.chats.set(chatId, {
          id: chatId,
          messages: [],
          typingUsers: new Set(),
          onlineUsers: 0,
          unreadCount: 0
        });
      }
      return { chats: new Map(state.chats) };
    });
  },

  addMessage: (chatId: string, message: SocketMessage) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (!chat) {
        state.chats.set(chatId, {
          id: chatId,
          messages: [message],
          typingUsers: new Set(),
          onlineUsers: 0,
          lastMessage: message,
          unreadCount: 0
        });
      } else {
        // Avoid duplicates
        if (!chat.messages.find(m => m.id === message.id)) {
          chat.messages = [...chat.messages, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          chat.lastMessage = message;
        }
      }
      return { chats: new Map(state.chats) };
    });
  },

  setActiveChat: (chatId: string | null) => {
    set({ activeChat: chatId });
  },

  clearChatMessages: (chatId: string) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (chat) {
        chat.messages = [];
        chat.lastMessage = undefined;
      }
      return { chats: new Map(state.chats) };
    });
  },

  setTypingUser: (chatId: string, userId: string, isTyping: boolean, userName?: string) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (chat) {
        if (isTyping) {
          chat.typingUsers.add(userId);
        } else {
          chat.typingUsers.delete(userId);
        }
      }
      return { chats: new Map(state.chats) };
    });
  },

  setOnlineUsers: (chatId: string, count: number) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (chat) {
        chat.onlineUsers = count;
      }
      return { chats: new Map(state.chats) };
    });
  },

  markMessageAsRead: (chatId: string, messageId: string) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (chat) {
        const message = chat.messages.find(m => m.id === messageId);
        if (message) {
          message.read = true;
        }
      }
      return { chats: new Map(state.chats) };
    });
  },

  incrementUnread: (chatId: string) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (chat && state.activeChat !== chatId) {
        chat.unreadCount += 1;
      }
      return { chats: new Map(state.chats) };
    });
  },

  clearUnread: (chatId: string) => {
    set((state) => {
      const chat = state.chats.get(chatId);
      if (chat) {
        chat.unreadCount = 0;
      }
      return { chats: new Map(state.chats) };
    });
  },

  getChat: (chatId: string) => {
    return get().chats.get(chatId);
  },

  getMessages: (chatId: string) => {
    return get().chats.get(chatId)?.messages || [];
  },

  getTypingUsers: (chatId: string) => {
    return Array.from(get().chats.get(chatId)?.typingUsers || []);
  }
}));
