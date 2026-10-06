'use client';

import type { SessionSummary } from '@hospital/types';
import { useAction, useSession } from '@/components/session-context';
import { useI18n } from '@/components/locale-provider';
import { ErrorText, Table, Td } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/i18n/translate';

export function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  const { mutate } = useSession();
  const { pending, error, run } = useAction();
  const { locale, t } = useI18n();

  async function revoke(session: SessionSummary) {
    const ok = await run(() => mutate('DELETE', `/auth/sessions/${session.id}`));
    if (ok && session.current) window.location.assign('/login');
  }

  return (
    <>
      <ErrorText message={error} />
      <Table headers={[t('account.started'), t('account.lastActivity'), t('account.ip'), t('account.browser'), '']}>
        {sessions.map((session) => (
          <tr key={session.id}>
            <Td>{formatDateTime(session.createdAt, locale)}</Td>
            <Td>{formatDateTime(session.lastSeenAt, locale)}</Td>
            <Td>{session.ipAddress ?? '—'}</Td>
            <Td>
              <span className="line-clamp-2 max-w-xs text-xs text-muted-foreground">{session.userAgent ?? '—'}</span>
            </Td>
            <Td>
              <Button variant={session.current ? 'secondary' : 'destructive'} disabled={pending} onClick={() => revoke(session)}>
                {session.current ? t('account.signOutHere') : t('account.revoke')}
              </Button>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
