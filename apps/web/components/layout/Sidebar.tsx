'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { usePresenceStore } from '@/store/presence.store';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { getInitials } from '@worknest/utils';

const NAV = [
  {
    label: 'Overview',
    href: '',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Goals',
    href: '/goals',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Action Items',
    href: '/action-items',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    label: 'Announcements',
    href: '/announcements',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M22 8.01c0-3.31-4.03-6-9-6S4 4.7 4 8.01c0 2.46 1.9 4.6 4.72 5.61L8 17l3.45-2.3C11.62 14.76 12 14.76 13 14.76c4.97 0 9-2.69 9-6.75z"/>
      </svg>
    ),
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isOnline = usePresenceStore((s) => s.isOnline);

  const base = activeWorkspace ? `/workspace/${activeWorkspace.slug}` : '#';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">W</div>
        <span className="sidebar-logo-text">WorkNest</span>
      </div>

      {/* Workspace Switcher */}
      <div style={{ padding: '0 0.75rem 0.75rem' }}>
        <WorkspaceSwitcher />
      </div>

      <div className="divider" style={{ margin: '0 0.75rem 0.75rem' }} />

      {/* Nav */}
      <nav className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-label">Workspace</div>
        {NAV.map((item) => {
          const href = `${base}${item.href}`;
          const isActive = item.href === ''
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(href);
          const badge = item.label === 'Notifications' && unreadCount > 0 ? unreadCount : null;
          return (
            <Link key={item.label} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon" style={{ position: 'relative' }}>
                {item.icon}
                {badge !== null && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, minWidth: 14, height: 14, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid var(--surface)' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="divider" style={{ margin: '0 0.75rem' }} />

      {/* Bottom: Settings + Profile + User */}
      <div style={{ padding: '0.5rem 0.75rem' }}>
        <Link href={`${base}/settings`} className={`nav-item ${pathname.includes('/settings') ? 'active' : ''}`}>
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </span>
          Settings
        </Link>
        <Link href="/profile" className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </span>
          My Profile
        </Link>
      </div>


      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className={`avatar avatar-sm ${user && isOnline(user.id) ? 'avatar-online' : ''}`}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} />
            ) : (
              getInitials(user?.name ?? 'U')
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
            <div className="truncate" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Sign out" style={{ flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
