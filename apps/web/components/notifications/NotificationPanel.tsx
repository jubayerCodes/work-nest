'use client';
import { useNotificationStore } from '@/store/notification.store';
import { timeAgo } from '@worknest/utils';
import { useEffect, useRef } from 'react';

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, markRead } = useNotificationStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'var(--header-height)',
        right: '1rem',
        width: 340,
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 500,
        overflow: 'hidden',
        animation: 'slideUp 0.18s ease',
      }}
    >
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '0.9375rem' }}>Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <div className="empty-state-icon">🔔</div>
            <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>All caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              style={{
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                background: n.read ? 'transparent' : 'var(--primary-muted)',
                cursor: n.read ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: '0.8375rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                {String((n.payload as Record<string, unknown>).message ?? n.type)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{timeAgo(n.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
