import { PasswordChangeForm } from '@/components/password-change-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Card } from '@/components/ui';
import { getTranslator } from '@/lib/i18n/server';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const me = await requireSession();
  const { t } = await getTranslator();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <h1 className="mb-2 text-xl font-semibold">{t('auth.changePassword')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {me.passwordChangeRequired ? t('auth.changeRequired') : t('auth.signedInAs', { username: me.user.username })}
      </p>
      <Card>
        <PasswordChangeForm csrfToken={me.csrfToken} minLength={me.passwordMinLength} />
      </Card>
    </main>
  );
}
