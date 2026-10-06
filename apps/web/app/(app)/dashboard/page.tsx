import { Card, PageHeader } from '@/components/ui';
import { requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const me = await requireSession();
  return (
    <>
      <PageHeader title={`Welcome, ${me.user.displayName}`} description="Authentication and administration only. Clinical modules are not available yet." />
      <Card title="Current context">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-slate-500">Hospital</dt>
          <dd>{me.activeTenant ? `${me.activeTenant.name} (${me.activeTenant.code})` : 'None selected'}</dd>
          <dt className="text-slate-500">Hospital roles</dt>
          <dd>{me.roles.length > 0 ? me.roles.join(', ') : '—'}</dd>
          <dt className="text-slate-500">Platform roles</dt>
          <dd>{me.platformRoles.length > 0 ? me.platformRoles.join(', ') : '—'}</dd>
          <dt className="text-slate-500">Session expires</dt>
          <dd>
            {new Date(me.session.absoluteExpiresAt).toLocaleString()} (idle timeout {new Date(me.session.idleExpiresAt).toLocaleTimeString()})
          </dd>
        </dl>
      </Card>
      <Card title={`Effective permissions (${me.permissions.length})`}>
        {me.permissions.length > 0 ? (
          <ul className="grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-3">
            {me.permissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No permissions in the current context.</p>
        )}
      </Card>
    </>
  );
}
