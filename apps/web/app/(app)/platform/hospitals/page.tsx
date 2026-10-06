import type { PlatformHospital } from '@hospital/types';
import Link from 'next/link';
import { HospitalsManager } from '@/components/admin/hospitals-manager';
import { ErrorText, PageHeader } from '@/components/ui';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function HospitalsPage() {
  const me = await requireSession();
  const hospitals = await loadPageData<PlatformHospital[]>('/platform/hospitals');
  return (
    <>
      <PageHeader title="Hospitals" description="Platform administration. Hospital data is managed by each hospital's administrators." />
      {me.permissions.includes('platform.audit.read') ? (
        <Link href="/admin/audit?scope=platform" className="mb-4 inline-block text-sm text-hospital-primary underline">
          Platform audit log
        </Link>
      ) : null}
      <ErrorText message={hospitals.error?.message} />
      {hospitals.data ? <HospitalsManager hospitals={hospitals.data} /> : null}
    </>
  );
}
