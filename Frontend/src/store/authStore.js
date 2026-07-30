import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { disconnectSocket } from '../lib/socket.js';
import { client } from '../lib/apolloClient.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('kuber_token', token);
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      logout: () => {
        localStorage.removeItem('kuber_token');
        disconnectSocket();
        client.clearStore();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'kuber_auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
