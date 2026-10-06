import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SessionProvider } from '@/components/session-context';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const me = await requireSession();
  if (me.passwordChangeRequired) redirect('/change-password');
  if (me.tenantSelectionRequired && me.platformRoles.length === 0) redirect('/select-hospital');

  return (
    <SessionProvider me={me}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
