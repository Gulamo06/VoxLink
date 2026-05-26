import { io, Socket } from 'socket.io-client';

// Singleton instance
let socketInstance: Socket | null = null;

export interface SocketMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  text?: string;
  voiceUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface TypingEvent {
  userId: string;
  username?: string;
  isTyping: boolean;
}

export interface UserStatus {
  userId: string;
  username?: string;
  status: 'online' | 'offline' | 'typing';
}

export const socketService = {
  /**
   * Initialize Socket.io connection
   */
  connect: (userId: string, username?: string, token?: string): Socket => {
    if (socketInstance?.connected) {
      return socketInstance;
    }

    const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

    socketInstance = io(socketUrl, {
      auth: {
        userId,
        username,
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    return socketInstance;
  },

  /**
   * Get current socket instance
   */
  getInstance: (): Socket | null => socketInstance,

  /**
   * Disconnect socket
   */
  disconnect: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  },

  /**
   * Join a chat room
   */
  joinChat: (chatId: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!socketInstance) {
        resolve();
        return;
      }

      socketInstance.emit('chat:join', { chatId }, () => {
        console.log(`[Socket] Joined chat: ${chatId}`);
        resolve();
      });
    });
  },

  /**
   * Leave a chat room
   */
  leaveChat: (chatId: string): void => {
    if (socketInstance) {
      socketInstance.emit('chat:leave', { chatId });
      console.log(`[Socket] Left chat: ${chatId}`);
    }
  },

  /**
   * Send a message
   */
  sendMessage: (chatId: string, messageId: string, text: string): void => {
    if (!socketInstance) return;

    socketInstance.emit('chat:send-message', {
      chatId,
      messageId,
      text,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Send a voice message
   */
  sendVoiceMessage: (chatId: string, messageId: string, voiceUrl: string): void => {
    if (!socketInstance) return;

    socketInstance.emit('chat:send-message', {
      chatId,
      messageId,
      voiceUrl,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Send typing indicator
   */
  setTyping: (chatId: string, isTyping: boolean): void => {
    if (!socketInstance) return;

    socketInstance.emit('chat:typing', {
      chatId,
      isTyping
    });
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: (chatId: string, messageId: string): void => {
    if (!socketInstance) return;

    socketInstance.emit('chat:message-read', {
      chatId,
      messageId
    });
  },

  /**
   * Listen to messages
   */
  onMessage: (callback: (message: SocketMessage) => void): (() => void) => {
    if (!socketInstance) return () => {};

    socketInstance.on('chat:message', callback);

    return () => {
      socketInstance?.off('chat:message', callback);
    };
  },

  /**
   * Listen to typing indicators
   */
  onTyping: (callback: (event: TypingEvent) => void): (() => void) => {
    if (!socketInstance) return () => {};

    socketInstance.on('chat:typing', callback);

    return () => {
      socketInstance?.off('chat:typing', callback);
    };
  },

  /**
   * Listen to user status
   */
  onUserStatus: (callback: (status: UserStatus) => void): (() => void) => {
    if (!socketInstance) return () => {};

    socketInstance.on('user:status', callback);

    return () => {
      socketInstance?.off('user:status', callback);
    };
  },

  /**
   * Listen to message read receipts
   */
  onMessageRead: (callback: (data: { messageId: string; readBy: string }) => void): (() => void) => {
    if (!socketInstance) return () => {};

    socketInstance.on('chat:message-read', callback);

    return () => {
      socketInstance?.off('chat:message-read', callback);
    };
  },

  /**
   * Listen to connection event
   */
  onConnected: (callback: () => void): (() => void) => {
    if (!socketInstance) return () => {};

    socketInstance.on('user:connected', callback);

    return () => {
      socketInstance?.off('user:connected', callback);
    };
  },

  /**
   * Get online users in chat
   */
  getOnlineUsers: (chatId: string): Promise<{ onlineUsers: number }> => {
    return new Promise((resolve) => {
      if (!socketInstance) {
        resolve({ onlineUsers: 0 });
        return;
      }

      socketInstance.emit('chat:get-online-users', { chatId }, (data) => {
        resolve(data);
      });
    });
  }
};
