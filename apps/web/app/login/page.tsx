'use client';

import { type FormEvent, useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/components/locale-provider';
import { ErrorText } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { apiCall } from '@/lib/client-api';
import { translateError } from '@/lib/i18n/translate';

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await apiCall('POST', '/auth/login', { body: { username, password } });
    setPassword('');
    setPending(false);
    if (result.ok) window.location.assign('/dashboard');
    else setError(translateError(t, result.error));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('app.name')}</p>
          <h1 className="text-xl font-semibold">{t('auth.signIn')}</h1>
        </div>
        <LanguageSwitcher />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5">
        <Field label={t('auth.username')} name="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorText message={error} />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">{t('auth.forgot')}</p>
    </main>
  );
}
