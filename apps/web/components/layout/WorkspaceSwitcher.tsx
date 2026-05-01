'use client';
import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { getContrastColor, hexToRgba } from '@worknest/utils';
import type { IWorkspace } from '@worknest/types';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitch = (ws: IWorkspace) => {
    setActiveWorkspace(ws);
    setOpen(false);
    router.push(`/workspace/${ws.slug}`);
  };

  const accentColor = activeWorkspace?.accentColor ?? '#6366f1';

  return (
    <>
      <div className="dropdown" ref={ref} style={{ width: '100%' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            background: hexToRgba(accentColor, 0.08),
            cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: getContrastColor(accentColor),
              flexShrink: 0,
            }}
          >
            {activeWorkspace?.name?.[0]?.toUpperCase() ?? 'W'}
          </div>
          <span className="truncate" style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}>
            {activeWorkspace?.name ?? 'Select workspace'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {open && (
          <div className="dropdown-menu" style={{ left: 0, right: 0, top: 'calc(100% + 6px)', minWidth: 'unset' }}>
            <div style={{ padding: '0.375rem 0.625rem', fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Workspaces
            </div>
            {workspaces.map((ws) => (
              <button key={ws.id} className="dropdown-item" onClick={() => handleSwitch(ws)}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: ws.accentColor, flexShrink: 0 }} />
                <span className="truncate">{ws.name}</span>
                {activeWorkspace?.id === ws.id && (
                  <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            ))}
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={() => { setShowCreate(true); setOpen(false); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New workspace
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
