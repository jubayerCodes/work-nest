'use client';
import { usePathname } from 'next/navigation';
import { useNotificationStore } from '@/store/notification.store';
import { useState } from 'react';
import NotificationPanel from '@/components/notifications/NotificationPanel';

const PAGE_TITLES: Record<string, string> = {
  '': 'Overview',
  'goals': 'Goals',
  'action-items': 'Action Items',
  'announcements': 'Announcements',
  'settings': 'Settings',
};

export default function Header() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [showNotifications, setShowNotifications] = useState(false);

  const segment = pathname.split('/').at(-1) ?? '';
  const title = PAGE_TITLES[segment] ?? 'WorkNest';

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        {/* Notification Bell */}
        <div className="notification-dot" style={{ position: 'relative' }}>
          <button
            id="notification-bell"
            className="btn btn-ghost btn-icon"
            onClick={() => setShowNotifications((o) => !o)}
            title="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>
      </div>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
}
