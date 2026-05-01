'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';

// /dashboard — auto-redirects to the active workspace, or shows "create workspace" prompt
export default function DashboardIndexPage() {
  const router = useRouter();
  const { workspaces, activeWorkspace, fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    const redirect = async () => {
      // If we already have an active workspace, go there immediately
      if (activeWorkspace?.slug) {
        router.replace(`/workspace/${activeWorkspace.slug}`);
        return;
      }

      // Otherwise wait for workspaces to load
      await fetchWorkspaces().catch(() => {});

      const { activeWorkspace: ws } = useWorkspaceStore.getState();
      if (ws?.slug) {
        router.replace(`/workspace/${ws.slug}`);
      }
      // If still no workspace → show the "create one" UI below
    };

    redirect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show a workspace if one is already known
  if (activeWorkspace?.slug) return null; // will redirect immediately

  // No workspaces yet — show a friendly prompt
  if (workspaces.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: '4rem' }}>
        <div className="empty-state-icon">🏢</div>
        <h2 className="empty-state-title">No workspaces yet</h2>
        <p className="empty-state-desc">
          Create your first workspace to start collaborating with your team.
        </p>
        <button
          className="btn btn-primary mt-4"
          onClick={() => {
            // Trigger workspace switcher dropdown — navigate to /dashboard and open modal
            // For now, show a simple prompt
            const name = prompt('Workspace name:');
            if (name) {
              useWorkspaceStore.getState().createWorkspace({ name }).then((ws) => {
                router.replace(`/workspace/${ws.slug}`);
              });
            }
          }}
        >
          Create workspace
        </button>
      </div>
    );
  }

  // Loading skeleton while redirect is processing
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your workspace…</p>
      </div>
    </div>
  );
}
