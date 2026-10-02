import type { HealthPayload } from '@hospital/types';
import { healthStatusSchema } from '@hospital/validation';
import { Button } from '@hospital/ui';
import Link from 'next/link';

async function fetchApiHealth(): Promise<HealthPayload | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { success?: boolean; data?: HealthPayload };
    if (!body.success || !body.data) {
      return null;
    }
    healthStatusSchema.parse(body.data.status);
    return body.data;
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const apiHealth = await fetchApiHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-hospital-primary">
          System
        </p>
        <h1 className="text-3xl font-bold text-hospital-ink">Health</h1>
        <p className="text-slate-700">
          Web application process is healthy. API status is checked against the configured API base
          URL.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Web</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-emerald-700">ok</dd>
          <dt className="text-slate-500">Service</dt>
          <dd className="font-medium">@hospital/web</dd>
          <dt className="text-slate-500">Timestamp</dt>
          <dd className="font-medium">{new Date().toISOString()}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">API</h2>
        {apiHealth ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-emerald-700">{apiHealth.status}</dd>
            <dt className="text-slate-500">Service</dt>
            <dd className="font-medium">{apiHealth.service}</dd>
            <dt className="text-slate-500">Version</dt>
            <dd className="font-medium">{apiHealth.version}</dd>
            <dt className="text-slate-500">Timestamp</dt>
            <dd className="font-medium">{apiHealth.timestamp}</dd>
          </dl>
        ) : (
          <p className="text-sm text-amber-800">
            API health unreachable. Start <code>@hospital/api</code> on the configured port to
            verify end-to-end health.
          </p>
        )}
      </section>

      <Link href="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </main>
  );
}
