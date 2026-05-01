'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IAuthUser } from '@worknest/types';
import { api } from '@/lib/api';

interface AuthState {
  user: IAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: IAuthUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          set({ user: res.data.data.user, isAuthenticated: true });
          // Set a web-domain cookie so Next.js middleware can detect auth across domains
          if (typeof document !== 'undefined') {
            document.cookie = 'wn_auth=1; path=/; max-age=86400; samesite=lax';
          }
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', { name, email, password });
          set({ user: res.data.data.user, isAuthenticated: true });
          // Set a web-domain cookie so Next.js middleware can detect auth across domains
          if (typeof document !== 'undefined') {
            document.cookie = 'wn_auth=1; path=/; max-age=86400; samesite=lax';
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await api.post('/auth/logout').catch(() => {});
        set({ user: null, isAuthenticated: false });
        // Clear the web-domain indicator cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'wn_auth=; path=/; max-age=0';
        }
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data.user, isAuthenticated: true });
          // Refresh the web-domain indicator cookie on every successful auth check
          if (typeof document !== 'undefined') {
            document.cookie = 'wn_auth=1; path=/; max-age=86400; samesite=lax';
          }
        } catch (err: unknown) {
          // Only clear auth on explicit 401 — ignore network errors / server restarts
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401) {
            set({ user: null, isAuthenticated: false });
            if (typeof document !== 'undefined') {
              document.cookie = 'wn_auth=; path=/; max-age=0';
            }
          }
        }
      },
    }),
    { name: 'worknest-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
