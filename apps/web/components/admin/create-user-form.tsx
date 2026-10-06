'use client';

import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { useAction, useSession } from '@/components/session-context';
import { ErrorText, Field } from '@/components/ui';
import { Button } from '@/components/ui/button';

export function CreateUserForm({ minLength }: { minLength: number }) {
  const { t } = useI18n();
  const { mutate } = useSession();
  const { pending, error, run } = useAction();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', temporaryPassword: '' });
  const [created, setCreated] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setCreated(null);
    const ok = await run(() =>
      mutate('POST', '/users', {
        username: form.username,
        displayName: form.displayName,
        temporaryPassword: form.temporaryPassword,
        ...(form.email ? { email: form.email } : {}),
      }),
    );
    if (ok) {
      setCreated(form.username);
      setForm({ username: '', displayName: '', email: '', temporaryPassword: '' });
    }
  }

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={t('auth.username')} required value={form.username} onChange={set('username')} autoComplete="off" />
      <Field label={t('account.displayName')} required value={form.displayName} onChange={set('displayName')} />
      <Field label={t('users.emailOptional')} type="email" value={form.email} onChange={set('email')} />
      <Field
        label={t('users.tempPassword', { min: minLength })}
        type="password"
        required
        minLength={minLength}
        autoComplete="new-password"
        value={form.temporaryPassword}
        onChange={set('temporaryPassword')}
      />
      <div className="space-y-2 sm:col-span-2">
        <ErrorText message={error} />
        {created ? <p className="text-sm text-success">{t('users.created', { username: created })}</p> : null}
        <Button type="submit" disabled={pending}>
          {t('users.create')}
        </Button>
      </div>
    </form>
  );
}
