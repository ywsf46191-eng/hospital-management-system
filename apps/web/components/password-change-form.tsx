'use client';

import { Button } from '@hospital/ui';
import { type FormEvent, useState } from 'react';
import { ErrorText, Field } from '@/components/ui';
import { apiCall, describeError } from '@/lib/client-api';

export function PasswordChangeForm({ csrfToken, minLength }: { csrfToken: string; minLength: number }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.');
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
    setError(describeError(result.error));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Current password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      <Field label={`New password (at least ${minLength} characters)`} type="password" autoComplete="new-password" required minLength={minLength} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      <ErrorText message={error} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Change password'}
      </Button>
      <p className="text-xs text-slate-500">All your other sessions are signed out after the change.</p>
    </form>
  );
}
