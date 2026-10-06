import type { DepartmentSummary, RoleSummary, TenantUser } from '@hospital/types';
import { UserAdminPanel } from '@/components/admin/user-admin-panel';
import { Card, ErrorText, PageHeader, StatusBadge } from '@/components/ui';
import { formatDateTime } from '@/lib/i18n/translate';
import { getTranslator } from '@/lib/i18n/server';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireSession();
  const { locale, t } = await getTranslator();
  const user = await loadPageData<TenantUser>(`/users/${encodeURIComponent(id)}`);
  if (!user.data) {
    return (
      <>
        <PageHeader title={t('users.title')} />
        <ErrorText message={user.error?.message ?? t('common.notFound')} />
      </>
    );
  }
  const [roles, departments] = await Promise.all([
    me.permissions.includes('role.read') ? loadPageData<RoleSummary[]>('/roles') : Promise.resolve({ data: [] as RoleSummary[] }),
    me.permissions.includes('department.read')
      ? loadPageData<DepartmentSummary[]>('/departments')
      : Promise.resolve({ data: [] as DepartmentSummary[] }),
  ]);

  return (
    <>
      <PageHeader title={user.data.displayName} description={user.data.username} />
      <Card title={t('users.account')}>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted-foreground">{t('users.accountStatus')}</dt>
          <dd>
            <StatusBadge status={user.data.userStatus} />
          </dd>
          <dt className="text-muted-foreground">{t('users.hospitalAccess')}</dt>
          <dd>
            <StatusBadge status={user.data.membershipStatus} />
          </dd>
          <dt className="text-muted-foreground">{t('users.email')}</dt>
          <dd>{user.data.email ?? '—'}</dd>
          <dt className="text-muted-foreground">{t('users.lastSignInLabel')}</dt>
          <dd>{user.data.lastLoginAt ? formatDateTime(user.data.lastLoginAt, locale) : t('users.never')}</dd>
        </dl>
      </Card>
      <UserAdminPanel
        user={user.data}
        roles={(roles.data ?? []).filter((role) => role.status === 'ACTIVE')}
        departments={(departments.data ?? []).filter((department) => department.status === 'ACTIVE')}
        isSelf={user.data.id === me.user.id}
      />
    </>
  );
}
