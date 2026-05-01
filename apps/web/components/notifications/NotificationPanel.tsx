'use client';
import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notification.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { timeAgo } from '@worknest/utils';
import type { INotification } from '@worknest/types';

const TYPE_ICONS: Record<string, string> = {
  ANNOUNCEMENT: '📢', MENTION: '💬', GOAL_UPDATE: '🎯',
  ACTION_ASSIGNED: '✅', MEMBER_JOINED: '👋',
};

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, markRead, markAllRead, fetchNotifications } = useNotificationStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  // Fetch on open
  useEffect(() => {
    if (activeWorkspace?.id) fetchNotifications(activeWorkspace.id);
  }, [activeWorkspace?.id, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', top: 'var(--header-height)', right: '1rem',
        width: 360, maxHeight: 480, background: 'var(--surface)',
        border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', animation: 'slideUp 0.15s ease',
      }}
    >
      {/* Header */}
      <div style={{ padding: '1rem 1.125rem 0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Notifications</span>
        {notifications.some((n) => !n.read) && (
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--primary)', padding: '2px 8px' }} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            🎉 You&apos;re all caught up!
          </div>
        ) : (
          notifications.slice(0, 30).map((n) => (
            <NotifItem key={n.id} notification={n} onRead={markRead} />
          ))
        )}
      </div>
    </div>
  );
}

function NotifItem({ notification: n, onRead }: { notification: INotification; onRead: (id: string) => void }) {
  const payload = n.payload as Record<string, string>;
  const message = payload.message ?? n.type.replace(/_/g, ' ').toLowerCase();

  return (
    <div
      onClick={() => { if (!n.read) onRead(n.id); }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
        padding: '0.75rem 1.125rem',
        background: n.read ? 'transparent' : 'var(--primary-muted)',
        borderBottom: '1px solid var(--border)',
        cursor: n.read ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1.4 }}>{TYPE_ICONS[n.type] ?? '🔔'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.5 }}>{message}</p>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{timeAgo(n.createdAt)}</span>
      </div>
      {!n.read && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />
      )}
    </div>
  );
}
