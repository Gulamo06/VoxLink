import api from './api';
import { Message } from '../types';

let mockIdCounter = 0;

function createMockMessage(chatId: string, text: string, senderId: string): Message {
  mockIdCounter += 1;
  return {
    id: `msg-${Date.now()}-${mockIdCounter}`,
    chatId,
    senderId,
    text,
    createdAt: new Date().toISOString(),
    read: false
  };
}

export const messageService = {
  fetchMessages: async (chatId: string): Promise<Message[]> => {
    if (import.meta.env.DEV) {
      return [];
    }
    const response = await api.get<Message[]>(`/messages/${chatId}`);
    return response.data;
  },
  sendMessage: async (chatId: string, text: string): Promise<Message> => {
    if (import.meta.env.DEV) {
      return createMockMessage(chatId, text, 'local-self');
    }
    const response = await api.post<Message>('/messages/send', { chatId, text });
    return response.data;
  },
  sendVoiceMessage: async (chatId: string, file: Blob): Promise<Message> => {
    if (import.meta.env.DEV) {
      const url = URL.createObjectURL(file);
      const msg = createMockMessage(chatId, '', 'local-self');
      msg.voiceUrl = url;
      return msg;
    }
    const formData = new FormData();
    formData.append('voice', file, 'voice.webm');
    formData.append('chatId', chatId);
    const response = await api.post<Message>('/messages/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
