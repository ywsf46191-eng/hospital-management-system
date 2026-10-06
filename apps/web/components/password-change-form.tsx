'use client';

import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { ErrorText } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { apiCall } from '@/lib/client-api';
import { translateError } from '@/lib/i18n/translate';

export function PasswordChangeForm({ csrfToken, minLength }: { csrfToken: string; minLength: number }) {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmation) {
      setError(t('auth.mismatch'));
      return;
    }
    setPending(true);
    setError(null);
    const result = await apiCall('POST', '/auth/password/change', { body: { currentPassword, newPassword }, csrfToken });
    setPending(false);
    if (result.ok) {
      window.location.assign('/dashboard');
      return;
    }
    setError(translateError(t, result.error));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t('auth.currentPassword')} type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      <Field
        label={t('auth.newPassword', { min: minLength })}
        type="password"
        autoComplete="new-password"
        required
        minLength={minLength}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <Field label={t('auth.confirmPassword')} type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      <ErrorText message={error} />
      <Button type="submit" disabled={pending}>
        {pending ? t('auth.saving') : t('auth.savePassword')}
      </Button>
      <p className="text-xs text-muted-foreground">{t('auth.othersSignedOut')}</p>
    </form>
  );
}
