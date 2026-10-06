'use client';

import type { SessionSummary } from '@hospital/types';
import { Button } from '@hospital/ui';
import { useAction, useSession } from '@/components/session-context';
import { ErrorText, Table, Td } from '@/components/ui';

export function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  const { mutate } = useSession();
  const { pending, error, run } = useAction();

  async function revoke(session: SessionSummary) {
    const ok = await run(() => mutate('DELETE', `/auth/sessions/${session.id}`));
    if (ok && session.current) window.location.assign('/login');
  }

  return (
    <>
      <ErrorText message={error} />
      <Table headers={['Started', 'Last activity', 'IP address', 'Browser', '']}>
        {sessions.map((session) => (
          <tr key={session.id}>
            <Td>{new Date(session.createdAt).toLocaleString()}</Td>
            <Td>{new Date(session.lastSeenAt).toLocaleString()}</Td>
            <Td>{session.ipAddress ?? '—'}</Td>
            <Td>
              <span className="line-clamp-2 max-w-xs text-xs text-slate-600">{session.userAgent ?? '—'}</span>
            </Td>
            <Td>
              <Button variant={session.current ? 'secondary' : 'danger'} disabled={pending} onClick={() => revoke(session)}>
                {session.current ? 'Sign out here' : 'Revoke'}
              </Button>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
