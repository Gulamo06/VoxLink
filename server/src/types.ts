export type PresenceStatus = 'online' | 'busy' | 'offline';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  status: PresenceStatus;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  username: string;
  avatar?: string;
  status: PresenceStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  voiceUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  channel: string;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
