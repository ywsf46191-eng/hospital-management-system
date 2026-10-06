import type { HealthComponentName, HealthPayload } from '@hospital/types';
import { healthStatusSchema } from '@hospital/validation';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiInternalBaseUrl } from '@/lib/api-base';
import { getTranslator } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

async function fetchApiHealth(): Promise<HealthPayload | null> {
  try {
    const response = await fetch(`${apiInternalBaseUrl()}/health`, { cache: 'no-store' });
    const body = (await response.json()) as { success?: boolean; data?: HealthPayload };
    if (!body.success || !body.data) return null;
    healthStatusSchema.parse(body.data.status);
    return body.data;
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const apiHealth = await fetchApiHealth();
  const { t } = await getTranslator();
  const labels: Record<HealthComponentName, string> = {
    application: t('health.application'),
    database: t('health.database'),
    redis: t('health.redis'),
    objectStorage: t('health.objectStorage'),
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('health.kicker')}</p>
        <h1 className="text-2xl font-semibold">{t('health.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('health.intro')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('health.web')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">{t('health.status')}</dt>
            <dd className="font-medium text-success">{t('common.ok')}</dd>
            <dt className="text-muted-foreground">{t('health.service')}</dt>
            <dd className="font-medium">@hospital/web</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('health.api')}</CardTitle>
        </CardHeader>
        <CardContent>
          {apiHealth ? (
            <>
              <p className="mb-3 text-sm">
                {t('health.overall')}:{' '}
                <span
                  data-testid="api-overall-status"
                  className={apiHealth.status === 'ok' ? 'font-semibold text-success' : 'font-semibold text-warning'}
                >
                  {apiHealth.status}
                </span>{' '}
                <span className="text-muted-foreground">
                  (v{apiHealth.version}, {apiHealth.timestamp})
                </span>
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('health.component')}</TableHead>
                    <TableHead>{t('health.status')}</TableHead>
                    <TableHead>{t('health.latency')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Object.keys(labels) as HealthComponentName[]).map((name) => {
                    const check = apiHealth.checks[name];
                    return (
                      <TableRow key={name}>
                        <TableCell>{labels[name]}</TableCell>
                        <TableCell className={check?.status === 'up' ? 'font-medium text-success' : 'font-medium text-destructive'}>
                          {check ? check.status : 'unknown'}
                          {check?.error ? ` (${check.error})` : ''}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {check ? (
                            <span dir="ltr">
                              {check.latencyMs} ms
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className="text-sm text-warning">{t('health.unreachable')}</p>
          )}
        </CardContent>
      </Card>

      <Button variant="secondary" asChild>
        <Link href="/">{t('health.back')}</Link>
      </Button>
    </main>
  );
}
