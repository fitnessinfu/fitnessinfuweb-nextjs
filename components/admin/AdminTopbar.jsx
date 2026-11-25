'use client';

import Link from 'next/link';

export default function AdminTopbar({ title, subtitle, actions }) {
  return (
    <header className="admin-topbar">
      <div>
        <h1 className="admin-topbar-title">{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{subtitle}</p>}
      </div>

      <div className="admin-topbar-actions">
        {actions}
        <Link href="/admin/courses/new" className="btn-admin-primary btn-admin-sm">
          + New Course
        </Link>
      </div>
    </header>
  );
}
