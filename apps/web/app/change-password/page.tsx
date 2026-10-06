import { PasswordChangeForm } from '@/components/password-change-form';
import { Card } from '@/components/ui';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const me = await requireSession();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-bold text-hospital-ink">Change password</h1>
      <p className="mb-6 text-sm text-slate-600">
        {me.passwordChangeRequired
          ? 'Your password was set by an administrator. Choose a new password to continue.'
          : `Signed in as ${me.user.username}.`}
      </p>
      <Card>
        <PasswordChangeForm csrfToken={me.csrfToken} minLength={me.passwordMinLength} />
      </Card>
    </main>
  );
}
