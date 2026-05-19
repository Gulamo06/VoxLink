import api from './api';
import { User } from '../types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function makeMock(username: string): AuthResponse {
  const user: User = {
    id: `local-${Date.now()}`,
    username,
    status: 'online',
    createdAt: new Date().toISOString()
  };
  return {
    user,
    accessToken: `local-token-${Math.random().toString(36).slice(2)}`,
    refreshToken: `local-refresh-${Math.random().toString(36).slice(2)}`
  };
}

export const authService = {
  login: async (username: string) => {
    if (import.meta.env.DEV) {
      return makeMock(username);
    }

    try {
      const response = await api.post<AuthResponse>('/auth/login', { username });
      return response.data;
    } catch {
      return makeMock(username);
    }
  },
  register: async (username: string) => {
    if (import.meta.env.DEV) {
      return makeMock(username);
    }

    try {
      const response = await api.post<AuthResponse>('/auth/register', { username });
      return response.data;
    } catch {
      return makeMock(username);
    }
  },
  refresh: async (refreshToken: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
      return response.data;
    } catch {
      return makeMock('guest');
    }
  }
};
