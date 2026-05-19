import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      setUser: (user, accessToken, refreshToken) =>
        set({ currentUser: user, accessToken, refreshToken }),
      clearAuth: () =>
        set({ currentUser: null, accessToken: null, refreshToken: null })
    }),
    {
      name: 'voxlink-auth'
    }
  )
);
