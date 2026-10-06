import type { SessionSummary } from '@hospital/types';
import Link from 'next/link';
import { SessionList } from '@/components/session-list';
import { Card, ErrorText, PageHeader } from '@/components/ui';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const me = await requireSession();
  const sessions = await loadPageData<SessionSummary[]>('/auth/sessions');
  return (
    <>
      <PageHeader title="My account" />
      <Card title="Profile">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-slate-500">Username</dt>
          <dd>{me.user.username}</dd>
          <dt className="text-slate-500">Display name</dt>
          <dd>{me.user.displayName}</dd>
          <dt className="text-slate-500">Email</dt>
          <dd>{me.user.email ?? '—'}</dd>
          <dt className="text-slate-500">Hospitals</dt>
          <dd>{me.memberships.map((membership) => membership.hospital.name).join(', ') || '—'}</dd>
        </dl>
        <Link href="/change-password" className="mt-4 inline-block text-sm text-hospital-primary underline">
          Change password
        </Link>
      </Card>
      <Card title="Active sessions">
        <ErrorText message={sessions.error?.message} />
        {sessions.data ? <SessionList sessions={sessions.data} /> : null}
      </Card>
    </>
  );
}
