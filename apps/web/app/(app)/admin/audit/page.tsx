import type { AuditLogEntry, Paginated } from '@hospital/types';
import Link from 'next/link';
import { Card, ErrorText, PageHeader, StatusBadge, Table, Td } from '@/components/ui';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; scope?: string }> }) {
  const me = await requireSession();
  const { page, scope } = await searchParams;
  const platform = scope === 'platform' && me.permissions.includes('platform.audit.read');
  const pageNumber = page && /^\d+$/.test(page) ? Number(page) : 1;
  const logs = await loadPageData<Paginated<AuditLogEntry>>(`${platform ? '/platform/audit-logs' : '/audit-logs'}?page=${pageNumber}&pageSize=50`);
  const base = platform ? '/admin/audit?scope=platform&' : '/admin/audit?';

  return (
    <>
      <PageHeader title="Audit log" description={platform ? 'Platform-level events.' : `Events in ${me.activeTenant?.name ?? 'this hospital'}. The log is append-only.`} />
      <ErrorText message={logs.error?.message} />
      {logs.data ? (
        <Card>
          <Table headers={['Time', 'Action', 'Result', 'Actor', 'Resource', 'Details']}>
            {logs.data.items.map((entry) => (
              <tr key={entry.id}>
                <Td>{new Date(entry.occurredAt).toLocaleString()}</Td>
                <Td>
                  <span className="font-mono text-xs">{entry.action}</span>
                </Td>
                <Td>
                  <StatusBadge status={entry.result} />
                  {entry.reason ? <span className="ml-1 text-xs text-slate-500">{entry.reason}</span> : null}
                </Td>
                <Td>
                  <span className="font-mono text-xs">{entry.actorUserId ?? entry.actorType}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs">{entry.resourceType ? `${entry.resourceType}:${entry.resourceId ?? ''}` : '—'}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-slate-600">
                    {[entry.metadata, entry.afterData].filter(Boolean).map((value) => JSON.stringify(value)).join(' ')}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
          <div className="mt-3 flex gap-4 text-sm">
            {pageNumber > 1 ? <Link href={`${base}page=${pageNumber - 1}`}>← Newer</Link> : null}
            {pageNumber * logs.data.pageSize < logs.data.total ? <Link href={`${base}page=${pageNumber + 1}`}>Older →</Link> : null}
            <span className="text-slate-500">{logs.data.total} event(s)</span>
          </div>
        </Card>
      ) : null}
    </>
  );
}
