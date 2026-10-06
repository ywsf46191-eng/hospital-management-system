import type { DepartmentSummary, RoleSummary, TenantUser } from '@hospital/types';
import { UserAdminPanel } from '@/components/admin/user-admin-panel';
import { Card, ErrorText, PageHeader, StatusBadge } from '@/components/ui';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireSession();
  const user = await loadPageData<TenantUser>(`/users/${encodeURIComponent(id)}`);
  if (!user.data) {
    return (
      <>
        <PageHeader title="User" />
        <ErrorText message={user.error?.message ?? 'User not found.'} />
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
      <Card title="Account">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-slate-500">Account status</dt>
          <dd>
            <StatusBadge status={user.data.userStatus} />
          </dd>
          <dt className="text-slate-500">Access to this hospital</dt>
          <dd>
            <StatusBadge status={user.data.membershipStatus} />
          </dd>
          <dt className="text-slate-500">Email</dt>
          <dd>{user.data.email ?? '—'}</dd>
          <dt className="text-slate-500">Last sign-in</dt>
          <dd>{user.data.lastLoginAt ? new Date(user.data.lastLoginAt).toLocaleString() : 'Never'}</dd>
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
