import type { AuditLogEntry, Paginated } from '@hospital/types';
import Link from 'next/link';
import { Card, ErrorText, PageHeader, StatusBadge, Table, Td } from '@/components/ui';
import { Pagination } from '@/components/ui/pagination';
import { formatDateTime } from '@/lib/i18n/translate';
import { getTranslator } from '@/lib/i18n/server';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; scope?: string }> }) {
  const me = await requireSession();
  const { locale, t } = await getTranslator();
  const { page, scope } = await searchParams;
  const platform = scope === 'platform' && me.permissions.includes('platform.audit.read');
  const pageNumber = page && /^\d+$/.test(page) ? Number(page) : 1;
  const logs = await loadPageData<Paginated<AuditLogEntry>>(
    `${platform ? '/platform/audit-logs' : '/audit-logs'}?page=${pageNumber}&pageSize=50`,
  );
  const base = platform ? '/admin/audit?scope=platform&' : '/admin/audit?';

  return (
    <>
      <PageHeader
        title={t('audit.title')}
        description={
          platform ? t('audit.platform') : t('audit.hospital', { hospital: me.activeTenant?.name ?? t('audit.thisHospital') })
        }
        actions={
          me.permissions.includes('platform.audit.read') ? (
            <Link href={platform ? '/admin/audit' : '/admin/audit?scope=platform'} className="text-sm text-primary underline">
              {platform ? t('audit.title') : t('audit.platformLink')}
            </Link>
          ) : null
        }
      />
      <ErrorText message={logs.error?.message} />
      {logs.data ? (
        <Card>
          <Table headers={[t('audit.time'), t('audit.action'), t('audit.result'), t('audit.actor'), t('audit.resource'), t('audit.details')]}>
            {logs.data.items.map((entry) => (
              <tr key={entry.id}>
                <Td>{formatDateTime(entry.occurredAt, locale)}</Td>
                <Td>
                  <span className="font-mono text-xs">{entry.action}</span>
                </Td>
                <Td>
                  <StatusBadge status={entry.result} />
                  {entry.reason ? <span className="ms-1 text-xs text-muted-foreground">{entry.reason}</span> : null}
                </Td>
                <Td>
                  <span className="font-mono text-xs">{entry.actorUserId ?? entry.actorType}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs">{entry.resourceType ? `${entry.resourceType}:${entry.resourceId ?? ''}` : '—'}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-muted-foreground">
                    {[entry.metadata, entry.afterData].filter(Boolean).map((value) => JSON.stringify(value)).join(' ')}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={pageNumber}
            pageSize={logs.data.pageSize}
            total={logs.data.total}
            hrefFor={(p) => `${base}page=${p}`}
            labels={{ newer: t('audit.newer'), older: t('audit.older'), summary: t('audit.summary', { total: logs.data.total }) }}
          />
        </Card>
      ) : null}
    </>
  );
}
