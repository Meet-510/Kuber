import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { disconnectSocket } from '../lib/socket.js';
import { client } from '../lib/apolloClient.js';
import { LOGOUT } from '../graphql/mutations.js';

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

      /**
       * Sign out. Best-effort revokes the server session before clearing
       * local state so a stolen token can't outlive the browser tab.
       * Never blocks the UI on a network failure — the client-side clear
       * always happens.
       */
      logout: async () => {
        try {
          await client.mutate({ mutation: LOGOUT, fetchPolicy: 'no-cache' });
        } catch {
          // Session may already be revoked (idle-expired); ignore.
        }
        localStorage.removeItem('kuber_token');
        disconnectSocket();
        await client.clearStore();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'kuber_auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
