import type { HealthComponentName, HealthPayload } from '@hospital/types';
import { healthStatusSchema } from '@hospital/validation';
import { Button } from '@hospital/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const COMPONENT_LABELS: Record<HealthComponentName, string> = {
  application: 'Application',
  database: 'PostgreSQL',
  redis: 'Redis',
  objectStorage: 'Object storage (MinIO)',
};

function apiBaseUrl(): string {
  return (
    process.env.API_INTERNAL_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:4000/api/v1'
  );
}

async function fetchApiHealth(): Promise<HealthPayload | null> {
  try {
    // A degraded API answers 503 with the same payload, so the body is read regardless of status.
    const response = await fetch(`${apiBaseUrl()}/health`, { cache: 'no-store' });
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
          Web application process is healthy. API and infrastructure status is read from the API
          health endpoint.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Web</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-emerald-700">ok</dd>
          <dt className="text-slate-500">Service</dt>
          <dd className="font-medium">@hospital/web</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">API</h2>
        {apiHealth ? (
          <>
            <p className="mb-3 text-sm">
              Overall:{' '}
              <span
                data-testid="api-overall-status"
                className={
                  apiHealth.status === 'ok'
                    ? 'font-semibold text-emerald-700'
                    : 'font-semibold text-amber-700'
                }
              >
                {apiHealth.status}
              </span>{' '}
              <span className="text-slate-500">
                (v{apiHealth.version}, {apiHealth.timestamp})
              </span>
            </p>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 font-medium">Component</th>
                  <th className="py-1 font-medium">Status</th>
                  <th className="py-1 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(COMPONENT_LABELS) as HealthComponentName[]).map((name) => {
                  const check = apiHealth.checks[name];
                  return (
                    <tr key={name} className="border-t border-slate-100">
                      <td className="py-1.5">{COMPONENT_LABELS[name]}</td>
                      <td
                        className={
                          check?.status === 'up'
                            ? 'py-1.5 font-medium text-emerald-700'
                            : 'py-1.5 font-medium text-red-700'
                        }
                      >
                        {check ? check.status : 'unknown'}
                        {check?.error ? ` (${check.error})` : ''}
                      </td>
                      <td className="py-1.5 text-slate-600">
                        {check ? `${check.latencyMs} ms` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-sm text-amber-800">
            API health unreachable. Start <code>@hospital/api</code> to verify end-to-end health.
          </p>
        )}
      </section>

      <Link href="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </main>
  );
}
