'use client';
import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useNotificationStore } from '@/store/notification.store';
import { api } from '@/lib/api';
import { timeAgo } from '@worknest/utils';
import type { INotification } from '@worknest/types';
import toast from 'react-hot-toast';

const TYPE_ICONS: Record<string, string> = {
  ANNOUNCEMENT: '📢',
  MENTION: '💬',
  GOAL_UPDATE: '🎯',
  ACTION_ASSIGNED: '✅',
  MEMBER_JOINED: '👋',
};

export default function NotificationsPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const { notifications, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchNotifications(activeWorkspace.id).finally(() => setLoading(false));
  }, [activeWorkspace?.id, fetchNotifications]);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text)' }}>Notifications</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            {notifications.filter((n) => !n.read).length} unread
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3 className="empty-state-title">All caught up!</h3>
          <p className="empty-state-desc">You have no notifications in this workspace.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, onRead }: { notification: INotification; onRead: (id: string) => void }) {
  const payload = n.payload as Record<string, string>;
  const icon = TYPE_ICONS[n.type] ?? '🔔';
  const message = payload.message ?? n.type.replace(/_/g, ' ').toLowerCase();

  return (
    <div
      onClick={() => { if (!n.read) onRead(n.id); }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1rem',
        background: n.read ? 'var(--surface)' : 'var(--primary-muted)',
        border: `1px solid ${n.read ? 'var(--border)' : 'var(--primary-ring)'}`,
        borderRadius: 'var(--radius)', cursor: n.read ? 'default' : 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>{message}</p>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{timeAgo(n.createdAt)}</span>
      </div>
      {!n.read && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
      )}
    </div>
  );
}
