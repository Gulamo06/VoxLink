import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { messageService } from '../services/messageService';
import { useChatRealTimeStore } from '../store/useChatRealTimeStore';
import { useAuthStore } from '../store/useAuthStore';
import { Message } from '../types';

interface UseChatOptions {
  chatId: string;
  onMessageReceived?: (message: Message) => void;
}

/**
 * Hook for real-time chat with Socket.io
 * Handles message sending, receiving, typing indicators, and online status
 */
export function useChat({ chatId, onMessageReceived }: UseChatOptions) {
  const { currentUser } = useAuthStore();
  const {
    addMessage,
    setActiveChat,
    setTypingUser,
    getMessages,
    getTypingUsers,
    incrementUnread,
    markMessageAsRead,
    initializeChat
  } = useChatRealTimeStore();

  const unsubscribeRef = useRef<(() => void)[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chat on mount
  useEffect(() => {
    initializeChat(chatId);
    setActiveChat(chatId);

    return () => {
      setActiveChat(null);
    };
  }, [chatId, initializeChat, setActiveChat]);

  // Connect to Socket.io and join chat
  useEffect(() => {
    if (!currentUser) return;

    // Connect if not already connected
    const socket = socketService.connect(
      currentUser.id,
      currentUser.username,
      localStorage.getItem('auth_token') || undefined
    );

    // Join chat room
    socketService.joinChat(chatId);

    // Listen to messages
    const unsubscribeMessage = socketService.onMessage((socketMessage) => {
      const message: Message = {
        id: socketMessage.id,
        chatId: socketMessage.chatId,
        senderId: socketMessage.senderId,
        text: socketMessage.text,
        voiceUrl: socketMessage.voiceUrl,
        createdAt: socketMessage.createdAt,
        read: socketMessage.read
      };

      addMessage(chatId, socketMessage);

      if (socketMessage.senderId !== currentUser.id) {
        incrementUnread(chatId);
      }

      onMessageReceived?.(message);
    });

    // Listen to typing indicators
    const unsubscribeTyping = socketService.onTyping(({ userId, username, isTyping }) => {
      if (userId !== currentUser.id) {
        setTypingUser(chatId, userId, isTyping, username);
      }
    });

    // Listen to message read receipts
    const unsubscribeRead = socketService.onMessageRead(({ messageId }) => {
      markMessageAsRead(chatId, messageId);
    });

    unsubscribeRef.current = [unsubscribeMessage, unsubscribeTyping, unsubscribeRead];

    return () => {
      // Cleanup
      unsubscribeRef.current.forEach(unsubscribe => unsubscribe());
      socketService.leaveChat(chatId);
    };
  }, [chatId, currentUser, addMessage, setTypingUser, incrementUnread, markMessageAsRead, onMessageReceived]);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !currentUser) return;

      try {
        // Create message locally and send via Socket.io
        const message = await messageService.sendMessage(chatId, text);
        
        socketService.sendMessage(chatId, message.id, text);
        addMessage(chatId, {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          text: message.text,
          voiceUrl: message.voiceUrl,
          createdAt: message.createdAt,
          read: false
        });
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [chatId, currentUser, addMessage]
  );

  // Send voice message
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (!currentUser) return;

      try {
        const message = await messageService.sendVoiceMessage(chatId, audioBlob);
        
        socketService.sendVoiceMessage(chatId, message.id, message.voiceUrl!);
        addMessage(chatId, {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          text: message.text,
          voiceUrl: message.voiceUrl,
          createdAt: message.createdAt,
          read: false
        });
      } catch (error) {
        console.error('Error sending voice message:', error);
        throw error;
      }
    },
    [chatId, currentUser, addMessage]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      socketService.setTyping(chatId, isTyping);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketService.setTyping(chatId, false);
        }, 3000);
      }
    },
    [chatId]
  );

  // Get current state
  const messages = getMessages(chatId);
  const typingUsers = getTypingUsers(chatId);

  return {
    messages,
    typingUsers,
    sendMessage,
    sendVoiceMessage,
    sendTypingIndicator
  };
}
