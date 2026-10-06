import type { PermissionSummary, RoleSummary } from '@hospital/types';
import { RolesManager } from '@/components/admin/roles-manager';
import { ErrorText, PageHeader } from '@/components/ui';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const me = await requireSession();
  const [roles, permissions] = await Promise.all([
    loadPageData<RoleSummary[]>('/roles'),
    me.permissions.includes('permission.read') ? loadPageData<PermissionSummary[]>('/permissions') : Promise.resolve({ data: [] as PermissionSummary[], error: null }),
  ]);
  return (
    <>
      <PageHeader title="Roles" description="System role templates are read-only. Create custom roles for this hospital and grant permissions you hold." />
      <ErrorText message={roles.error?.message ?? permissions.error?.message} />
      {roles.data ? <RolesManager roles={roles.data} permissions={(permissions.data ?? []).filter((permission) => permission.moduleEnabled)} /> : null}
    </>
  );
}
