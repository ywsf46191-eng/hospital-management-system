import type { DepartmentSummary } from '@hospital/types';
import { DepartmentsManager } from '@/components/admin/departments-manager';
import { ErrorText, PageHeader } from '@/components/ui';
import { loadPageData } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const departments = await loadPageData<DepartmentSummary[]>('/departments');
  return (
    <>
      <PageHeader title="Departments" />
      <ErrorText message={departments.error?.message} />
      {departments.data ? <DepartmentsManager departments={departments.data} /> : null}
    </>
  );
}
