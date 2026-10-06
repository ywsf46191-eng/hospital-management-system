import { APP_NAME } from '@hospital/config';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/logout-button';
import { SessionProvider } from '@/components/session-context';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

/** Navigation reflects permissions for convenience only; the API enforces every request. */
const NAV: { href: string; label: string; permission?: string }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users', permission: 'user.read' },
  { href: '/admin/roles', label: 'Roles', permission: 'role.read' },
  { href: '/admin/departments', label: 'Departments', permission: 'department.read' },
  { href: '/admin/audit', label: 'Audit log', permission: 'audit.read' },
  { href: '/platform/hospitals', label: 'Hospitals', permission: 'tenant.read' },
  { href: '/account', label: 'My account' },
];

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const me = await requireSession();
  if (me.passwordChangeRequired) redirect('/change-password');
  if (me.tenantSelectionRequired && me.platformRoles.length === 0) redirect('/select-hospital');

  const permissions = new Set(me.permissions);
  const links = NAV.filter((item) => !item.permission || permissions.has(item.permission));

  return (
    <SessionProvider me={me}>
      <div className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div>
              <p className="text-sm font-bold text-hospital-ink">{APP_NAME}</p>
              <p className="text-xs text-slate-500">
                {me.activeTenant ? me.activeTenant.name : me.platformRoles.length > 0 ? 'Platform administration' : 'No hospital selected'}
                {me.memberships.length > 1 ? (
                  <>
                    {' · '}
                    <Link href="/select-hospital" className="underline">
                      switch
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-600">{me.user.displayName}</span>
              <LogoutButton />
            </div>
          </div>
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-4 px-6 pb-3 text-sm">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-700 hover:text-hospital-primary">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
