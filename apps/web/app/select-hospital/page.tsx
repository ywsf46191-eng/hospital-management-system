import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HospitalSelector } from '@/components/hospital-selector';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Card } from '@/components/ui';
import { getTranslator } from '@/lib/i18n/server';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function SelectHospitalPage() {
  const me = await requireSession();
  const { t } = await getTranslator();
  if (me.passwordChangeRequired) redirect('/change-password');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <h1 className="mb-2 text-xl font-semibold">{t('auth.selectHospital')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('auth.selectHospitalHelp')}</p>
      <Card>
        {me.memberships.length > 0 ? (
          <HospitalSelector memberships={me.memberships} activeTenantId={me.activeTenant?.id ?? null} csrfToken={me.csrfToken} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('auth.noMemberships')}</p>
        )}
      </Card>
      {me.platformRoles.length > 0 ? (
        <Link href="/dashboard" className="text-sm text-primary underline">
          {t('auth.continuePlatform')}
        </Link>
      ) : null}
    </main>
  );
}
