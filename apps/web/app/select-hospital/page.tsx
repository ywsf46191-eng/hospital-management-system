import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HospitalSelector } from '@/components/hospital-selector';
import { Card } from '@/components/ui';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function SelectHospitalPage() {
  const me = await requireSession();
  if (me.passwordChangeRequired) redirect('/change-password');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-bold text-hospital-ink">Select hospital</h1>
      <p className="mb-6 text-sm text-slate-600">You have access to more than one hospital. Choose where to work.</p>
      <Card>
        {me.memberships.length > 0 ? (
          <HospitalSelector memberships={me.memberships} activeTenantId={me.activeTenant?.id ?? null} csrfToken={me.csrfToken} />
        ) : (
          <p className="text-sm text-slate-600">You are not a member of any hospital.</p>
        )}
      </Card>
      {me.platformRoles.length > 0 ? (
        <Link href="/dashboard" className="text-sm text-hospital-primary underline">
          Continue to platform administration
        </Link>
      ) : null}
    </main>
  );
}
