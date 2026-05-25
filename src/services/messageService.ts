import api from './api';
import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import { Message } from '../types';
import { useAuthStore } from '../store/useAuthStore';

let mockIdCounter = 0;

function createMockMessage(chatId: string, text: string, senderId: string, voiceUrl?: string): Message {
  mockIdCounter += 1;
  return {
    id: `msg-${Date.now()}-${mockIdCounter}`,
    chatId,
    senderId,
    text: text || undefined,
    voiceUrl,
    createdAt: new Date().toISOString(),
    read: false
  };
}

export const messageService = {
  fetchMessages: async (chatId: string): Promise<Message[]> => {
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        text: msg.text || undefined,
        voiceUrl: msg.voice_url || undefined,
        createdAt: msg.created_at,
        read: msg.read || false
      }));
    } catch (err) {
      console.error('Fetch messages error:', err);
      return [];
    }
  },

  sendMessage: async (chatId: string, text: string): Promise<Message> => {
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (!isSupabaseConfigured) {
      return createMockMessage(chatId, text, 'local-self');
    }

    try {
      const { currentUser } = useAuthStore.getState();
      const senderId = currentUser?.id || 'anonymous';

      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          text,
          created_at: new Date().toISOString(),
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        chatId: data.chat_id,
        senderId: data.sender_id,
        text: data.text || undefined,
        voiceUrl: data.voice_url || undefined,
        createdAt: data.created_at,
        read: data.read || false
      };
    } catch (err) {
      console.error('Send message error:', err);
      return createMockMessage(chatId, text, 'local-self');
    }
  },

  sendVoiceMessage: async (chatId: string, audioBlob: Blob): Promise<Message> => {
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (!isSupabaseConfigured) {
      const url = URL.createObjectURL(audioBlob);
      const msg = createMockMessage(chatId, '', 'local-self', url);
      return msg;
    }

    try {
      const { currentUser } = useAuthStore.getState();
      const senderId = currentUser?.id || 'anonymous';

      // Upload audio to storage
      const voiceUrl = await storageService.uploadAudio(audioBlob, senderId);

      // Insert message record into database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          voice_url: voiceUrl,
          created_at: new Date().toISOString(),
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        chatId: data.chat_id,
        senderId: data.sender_id,
        text: data.text || undefined,
        voiceUrl: data.voice_url || undefined,
        createdAt: data.created_at,
        read: data.read || false
      };
    } catch (err) {
      console.error('Send voice message error:', err);
      const url = URL.createObjectURL(audioBlob);
      return createMockMessage(chatId, '', 'local-self', url);
    }
  },

  /**
   * Setup a real-time subscription to messages in a chat
   * @param chatId - The chat ID to listen to
   * @param onMessageReceived - Callback when a new message arrives
   * @returns Unsubscribe function
   */
  subscribeToMessages: (chatId: string, onMessageReceived: (message: Message) => void) => {
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (!isSupabaseConfigured) {
      return () => {};
    }

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            chatId: payload.new.chat_id,
            senderId: payload.new.sender_id,
            text: payload.new.text || undefined,
            voiceUrl: payload.new.voice_url || undefined,
            createdAt: payload.new.created_at,
            read: payload.new.read || false
          };
          onMessageReceived(newMessage);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
