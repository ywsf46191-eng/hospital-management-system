import type { DepartmentSummary } from '@hospital/types';
import { DepartmentsManager } from '@/components/admin/departments-manager';
import { ErrorText, PageHeader } from '@/components/ui';
import { getTranslator } from '@/lib/i18n/server';
import { loadPageData } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const { t } = await getTranslator();
  const departments = await loadPageData<DepartmentSummary[]>('/departments');
  return (
    <>
      <PageHeader title={t('departments.title')} />
      <ErrorText message={departments.error?.message} />
      {departments.data ? <DepartmentsManager departments={departments.data} /> : null}
    </>
  );
}
