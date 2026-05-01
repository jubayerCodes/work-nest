'use client';
import { create } from 'zustand';

interface PresenceState {
  onlineUserIds: Set<string>;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  isOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: new Set(),

  setOnlineUsers: (userIds) =>
    set({ onlineUserIds: new Set(userIds) }),

  addOnlineUser: (userId) =>
    set((s) => ({ onlineUserIds: new Set([...s.onlineUserIds, userId]) })),

  removeOnlineUser: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next };
    }),

  isOnline: (userId) => get().onlineUserIds.has(userId),
}));
