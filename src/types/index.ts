export type PresenceStatus = 'online' | 'busy' | 'offline';

export interface User {
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
  members: User[];
  channel: string;
}

export interface CallState {
  active: boolean;
  channel?: string;
  hostId?: string;
  muted: boolean;
  speakerEnabled: boolean;
  startedAt?: number;
  participants: Record<string, PresenceStatus>;
}
