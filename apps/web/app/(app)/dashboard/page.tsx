import { Card, PageHeader } from '@/components/ui';
import { formatDateTime, formatTime } from '@/lib/i18n/translate';
import { getTranslator } from '@/lib/i18n/server';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const me = await requireSession();
  const { locale, t } = await getTranslator();
  return (
    <>
      <PageHeader title={t('dashboard.welcome', { name: me.user.displayName })} description={t('dashboard.intro')} />
      <Card title={t('dashboard.context')}>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted-foreground">{t('dashboard.hospital')}</dt>
          <dd>{me.activeTenant ? `${me.activeTenant.name} (${me.activeTenant.code})` : t('dashboard.noneSelected')}</dd>
          <dt className="text-muted-foreground">{t('dashboard.hospitalRoles')}</dt>
          <dd>{me.roles.length > 0 ? me.roles.join(', ') : t('dashboard.none')}</dd>
          <dt className="text-muted-foreground">{t('dashboard.platformRoles')}</dt>
          <dd>{me.platformRoles.length > 0 ? me.platformRoles.join(', ') : t('dashboard.none')}</dd>
          <dt className="text-muted-foreground">{t('dashboard.sessionExpires')}</dt>
          <dd>
            {formatDateTime(me.session.absoluteExpiresAt, locale)} ({t('dashboard.idle', { time: formatTime(me.session.idleExpiresAt, locale) })})
          </dd>
        </dl>
      </Card>
      <Card title={t('dashboard.permissions', { count: me.permissions.length })}>
        {me.permissions.length > 0 ? (
          <ul className="grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-3">
            {me.permissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('dashboard.noPermissions')}</p>
        )}
      </Card>
    </>
  );
}
