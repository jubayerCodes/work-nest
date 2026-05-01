'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IWorkspace, IWorkspaceMember } from '@worknest/types';
import { api } from '@/lib/api';

interface WorkspaceState {
  workspaces: IWorkspace[];
  activeWorkspace: IWorkspace | null;
  members: IWorkspaceMember[];
  isLoading: boolean;
  setActiveWorkspace: (workspace: IWorkspace) => void;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; accentColor?: string }) => Promise<IWorkspace>;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      members: [],
      isLoading: false,

      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

      fetchWorkspaces: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get('/workspaces');
          const memberships = res.data.data as { workspace: IWorkspace; role: string }[];
          const workspaces = memberships.map((m) => ({ ...m.workspace, role: m.role }));
          set({ workspaces });
          // Set first workspace as active if none selected
          if (!get().activeWorkspace && workspaces.length > 0) {
            set({ activeWorkspace: workspaces[0] });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      fetchWorkspace: async (workspaceId) => {
        const res = await api.get(`/workspaces/${workspaceId}`);
        const data = res.data.data;
        set({ activeWorkspace: data, members: data.members ?? [] });
      },

      createWorkspace: async (data) => {
        const res = await api.post('/workspaces', data);
        const workspace = res.data.data as IWorkspace;
        set((s) => ({ workspaces: [...s.workspaces, workspace], activeWorkspace: workspace }));
        return workspace;
      },
    }),
    { name: 'worknest-workspace', partialize: (s) => ({ activeWorkspace: s.activeWorkspace }) }
  )
);
