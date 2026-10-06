'use client';

import { Button } from '@hospital/ui';
import { type FormEvent, useState } from 'react';
import { useAction, useSession } from '@/components/session-context';
import { ErrorText, Field } from '@/components/ui';

export function CreateUserForm({ minLength }: { minLength: number }) {
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
      <Field label="Username" required value={form.username} onChange={set('username')} autoComplete="off" />
      <Field label="Display name" required value={form.displayName} onChange={set('displayName')} />
      <Field label="Email (optional)" type="email" value={form.email} onChange={set('email')} />
      <Field
        label={`Temporary password (min ${minLength})`}
        type="password"
        required
        minLength={minLength}
        autoComplete="new-password"
        value={form.temporaryPassword}
        onChange={set('temporaryPassword')}
      />
      <div className="sm:col-span-2 space-y-2">
        <ErrorText message={error} />
        {created ? <p className="text-sm text-emerald-700">User {created} created. They must change the password at first sign-in.</p> : null}
        <Button type="submit" disabled={pending}>
          Create user
        </Button>
      </div>
    </form>
  );
}
