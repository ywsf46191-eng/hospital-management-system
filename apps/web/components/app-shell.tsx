'use client';

import type { AuthMe } from '@hospital/types';
import {
  Building2,
  CircleUser,
  Hospital,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/components/locale-provider';
import { useSession } from '@/components/session-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { apiCall } from '@/lib/client-api';

const NAV: { href: string; labelKey: string; permission?: string; icon: typeof LayoutDashboard }[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'nav.users', permission: 'user.read', icon: Users },
  { href: '/admin/roles', labelKey: 'nav.roles', permission: 'role.read', icon: Shield },
  { href: '/admin/departments', labelKey: 'nav.departments', permission: 'department.read', icon: Building2 },
  { href: '/admin/audit', labelKey: 'nav.audit', permission: 'audit.read', icon: ScrollText },
  { href: '/platform/hospitals', labelKey: 'nav.hospitals', permission: 'tenant.read', icon: Hospital },
  { href: '/account', labelKey: 'nav.account', icon: CircleUser },
];

function SidebarNav({ me }: { me: AuthMe }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const permissions = new Set(me.permissions);
  const items = NAV.filter((item) => !item.permission || permissions.has(item.permission));
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label={t('app.name')}>
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted',
              active ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  const { me } = useSession();
  const { t } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={async () => {
        await apiCall('POST', '/auth/logout', { csrfToken: me.csrfToken });
        window.location.assign('/login');
      }}
    >
      <LogOut />
      {t('auth.signOut')}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me } = useSession();
  const { t } = useI18n();
  const hospitalLabel = me.activeTenant
    ? me.activeTenant.name
    : me.platformRoles.length > 0
      ? t('app.platformAdmin')
      : t('app.noHospital');

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 shrink-0 flex-col border-e border-border bg-surface">
        <div className="px-3 py-4">
          <p className="text-sm font-semibold text-foreground">{t('app.name')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hospitalLabel}</p>
          {me.memberships.length > 1 ? (
            <Link href="/select-hospital" className="mt-1 inline-block text-xs text-primary hover:underline">
              {t('app.switchHospital')}
            </Link>
          ) : null}
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav me={me} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-6 py-2">
          <p className="truncate text-sm text-muted-foreground">{me.user.displayName}</p>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
