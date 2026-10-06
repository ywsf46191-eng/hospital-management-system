'use client';

import type { PermissionSummary, RoleSummary } from '@hospital/types';
import { Button } from '@hospital/ui';
import { type FormEvent, useState } from 'react';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, SelectField, StatusBadge } from '@/components/ui';

export function RolesManager({ roles, permissions }: { roles: RoleSummary[]; permissions: PermissionSummary[] }) {
  const { can, mutate } = useSession();
  const { pending, error, run } = useAction();
  const [newRole, setNewRole] = useState({ key: '', name: '', description: '' });
  const [grant, setGrant] = useState<Record<string, { permission: string; scope: string }>>({});

  async function createRole(event: FormEvent) {
    event.preventDefault();
    const ok = await run(() =>
      mutate('POST', '/roles', {
        key: newRole.key.toUpperCase(),
        name: newRole.name,
        ...(newRole.description ? { description: newRole.description } : {}),
      }),
    );
    if (ok) setNewRole({ key: '', name: '', description: '' });
  }

  return (
    <>
      <ErrorText message={error} />
      {can('role.create') ? (
        <Card title="Create custom role">
          <form onSubmit={createRole} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
            <Field label="Key (A-Z, 0-9, _)" required value={newRole.key} onChange={(event) => setNewRole({ ...newRole, key: event.target.value })} />
            <Field label="Name" required value={newRole.name} onChange={(event) => setNewRole({ ...newRole, name: event.target.value })} />
            <Field label="Description" value={newRole.description} onChange={(event) => setNewRole({ ...newRole, description: event.target.value })} />
            <Button type="submit" disabled={pending}>
              Create
            </Button>
          </form>
        </Card>
      ) : null}

      {roles.map((role) => {
        const editable = !role.isSystem && can('role.update');
        const selection = grant[role.id] ?? { permission: '', scope: 'HOSPITAL' };
        return (
          <Card key={role.id}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {role.name} <span className="text-xs font-normal text-slate-500">{role.key}</span>
                </h2>
                <p className="text-xs text-slate-500">{role.isSystem ? 'System template (read-only)' : 'Custom role'}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={role.status} />
                {editable ? (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => mutate('PATCH', `/roles/${role.id}`, { status: role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }))}
                  >
                    {role.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </Button>
                ) : null}
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-slate-700">{role.permissions.length} permission(s)</summary>
              <ul className="mt-2 grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-2">
                {role.permissions.map((permission) => (
                  <li key={permission.key} className="flex items-center gap-2">
                    {permission.key} <span className="text-slate-400">[{permission.scope}]</span>
                    {editable ? (
                      <button type="button" className="text-red-700" disabled={pending} onClick={() => run(() => mutate('DELETE', `/roles/${role.id}/permissions/${permission.key}`))}>
                        ×
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
            {editable ? (
              <form
                className="mt-3 grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (await run(() => mutate('POST', `/roles/${role.id}/permissions`, selection))) {
                    setGrant({ ...grant, [role.id]: { permission: '', scope: selection.scope } });
                  }
                }}
              >
                <SelectField label="Permission" required value={selection.permission} onChange={(event) => setGrant({ ...grant, [role.id]: { ...selection, permission: event.target.value } })}>
                  <option value="">Select…</option>
                  {permissions
                    .filter((permission) => !role.permissions.some((item) => item.key === permission.key))
                    .map((permission) => (
                      <option key={permission.key} value={permission.key}>
                        {permission.key}
                      </option>
                    ))}
                </SelectField>
                <SelectField label="Scope" value={selection.scope} onChange={(event) => setGrant({ ...grant, [role.id]: { ...selection, scope: event.target.value } })}>
                  <option value="HOSPITAL">Whole hospital</option>
                  <option value="DEPARTMENT">Own department</option>
                  <option value="OWN_RECORD">Own records</option>
                </SelectField>
                <Button type="submit" disabled={pending || !selection.permission}>
                  Grant
                </Button>
              </form>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}
