import type { SessionSummary } from '@hospital/types';
import Link from 'next/link';
import { SessionList } from '@/components/session-list';
import { Card, ErrorText, PageHeader } from '@/components/ui';
import { getTranslator } from '@/lib/i18n/server';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const me = await requireSession();
  const { t } = await getTranslator();
  const sessions = await loadPageData<SessionSummary[]>('/auth/sessions');
  return (
    <>
      <PageHeader title={t('account.title')} />
      <Card title={t('account.profile')}>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted-foreground">{t('account.username')}</dt>
          <dd>{me.user.username}</dd>
          <dt className="text-muted-foreground">{t('account.displayName')}</dt>
          <dd>{me.user.displayName}</dd>
          <dt className="text-muted-foreground">{t('account.email')}</dt>
          <dd>{me.user.email ?? '—'}</dd>
          <dt className="text-muted-foreground">{t('account.hospitals')}</dt>
          <dd>{me.memberships.map((membership) => membership.hospital.name).join(', ') || '—'}</dd>
        </dl>
        <Link href="/change-password" className="mt-4 inline-block text-sm text-primary underline">
          {t('account.changePassword')}
        </Link>
      </Card>
      <Card title={t('account.sessions')}>
        <ErrorText message={sessions.error?.message} />
        {sessions.data ? <SessionList sessions={sessions.data} /> : null}
      </Card>
    </>
  );
}
