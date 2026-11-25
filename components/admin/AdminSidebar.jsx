'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/courses', label: 'Courses', icon: '🏋️' },
  { href: '/admin/users', label: 'Athletes & Users', icon: '👥' },
  { href: '/admin/attendance', label: 'Attendance', icon: '📅' },
  { href: '/admin/activity', label: 'Activity Logs', icon: '⚡' },
];

export default function AdminSidebar({ admin }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  return (
    <>
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <Link href="/admin/dashboard" className="admin-brand">
          <Image src="/logo.jpeg" alt="Fitnessinfu Logo" width={38} height={38} style={{ borderRadius: '4px' }} />
          <div>
            <div className="admin-brand-title">
              FITNESS<span>INFU</span>
            </div>
            <div className="admin-brand-tag">Admin Console</div>
          </div>
        </Link>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <Link
              href="/"
              target="_blank"
              className="admin-nav-item"
              style={{ fontSize: '0.82rem', opacity: 0.8 }}
            >
              <span className="admin-nav-icon">🌐</span>
              <span>View Public Website ↗</span>
            </Link>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-user-info">
              <span className="admin-user-name">{admin?.name || 'Administrator'}</span>
              <span className="admin-user-role">{admin?.email || 'admin@fitnessinfu.com'}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-admin-logout"
              title="Sign out of Admin Console"
            >
              {loggingOut ? '...' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
