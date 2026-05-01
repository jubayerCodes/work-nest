'use client';
import { create } from 'zustand';
import type { INotification } from '@worknest/types';
import { api } from '@/lib/api';

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  addNotification: (n: INotification) => void;
  fetchNotifications: (workspaceId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  fetchNotifications: async (workspaceId) => {
    try {
      const res = await api.get(`/notifications?workspaceId=${workspaceId}`);
      const notifications: INotification[] = res.data.data;
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    } catch {}
  },

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
