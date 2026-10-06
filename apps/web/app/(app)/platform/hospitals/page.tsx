import type { PlatformHospital } from '@hospital/types';
import Link from 'next/link';
import { HospitalsManager } from '@/components/admin/hospitals-manager';
import { ErrorText, PageHeader } from '@/components/ui';
import { getTranslator } from '@/lib/i18n/server';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function HospitalsPage() {
  const me = await requireSession();
  const { t } = await getTranslator();
  const hospitals = await loadPageData<PlatformHospital[]>('/platform/hospitals');
  return (
    <>
      <PageHeader title={t('hospitals.title')} description={t('hospitals.description')} />
      {me.permissions.includes('platform.audit.read') ? (
        <Link href="/admin/audit?scope=platform" className="mb-4 inline-block text-sm text-primary underline">
          {t('audit.platformLink')}
        </Link>
      ) : null}
      <ErrorText message={hospitals.error?.message} />
      {hospitals.data ? <HospitalsManager hospitals={hospitals.data} /> : null}
    </>
  );
}
