'use client';

import { APP_NAME } from '@hospital/config';
import { Button } from '@hospital/ui';
import { type FormEvent, useState } from 'react';
import { ErrorText, Field } from '@/components/ui';
import { apiCall, describeError } from '@/lib/client-api';

export default function LoginPage() {
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
    else setError(describeError(result.error));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-hospital-primary">{APP_NAME}</p>
        <h1 className="text-2xl font-bold text-hospital-ink">Sign in</h1>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Username" name="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorText message={error} />
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-xs text-slate-500">
        Forgot your password? Ask your hospital administrator to reset it.
      </p>
    </main>
  );
}
