'use client';

import type { PermissionSummary, RoleSummary } from '@hospital/types';
import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, SelectField, StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui/button';

export function RolesManager({ roles, permissions }: { roles: RoleSummary[]; permissions: PermissionSummary[] }) {
  const { t } = useI18n();
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
        <Card title={t('roles.create')}>
          <form onSubmit={createRole} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
            <Field label={t('roles.key')} required value={newRole.key} onChange={(event) => setNewRole({ ...newRole, key: event.target.value })} />
            <Field label={t('roles.name')} required value={newRole.name} onChange={(event) => setNewRole({ ...newRole, name: event.target.value })} />
            <Field label={t('roles.descriptionField')} value={newRole.description} onChange={(event) => setNewRole({ ...newRole, description: event.target.value })} />
            <Button type="submit" disabled={pending}>
              {t('roles.createAction')}
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
                <h2 className="text-base font-semibold">
                  {role.name} <span className="text-xs font-normal text-muted-foreground">{role.key}</span>
                </h2>
                <p className="text-xs text-muted-foreground">{role.isSystem ? t('roles.system') : t('roles.custom')}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={role.status} />
                {editable ? (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => mutate('PATCH', `/roles/${role.id}`, { status: role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }))}
                  >
                    {role.status === 'ACTIVE' ? t('roles.disable') : t('roles.enable')}
                  </Button>
                ) : null}
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-sm">{t('roles.permissionCount', { count: role.permissions.length })}</summary>
              <ul className="mt-2 grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-2">
                {role.permissions.map((permission) => (
                  <li key={permission.key} className="flex items-center gap-2">
                    {permission.key} <span className="text-muted-foreground">[{permission.scope}]</span>
                    {editable ? (
                      <button type="button" className="text-destructive" disabled={pending} onClick={() => run(() => mutate('DELETE', `/roles/${role.id}/permissions/${permission.key}`))}>
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
                <SelectField label={t('roles.permission')} required value={selection.permission} onChange={(event) => setGrant({ ...grant, [role.id]: { ...selection, permission: event.target.value } })}>
                  <option value="">{t('users.select')}</option>
                  {permissions
                    .filter((permission) => !role.permissions.some((item) => item.key === permission.key))
                    .map((permission) => (
                      <option key={permission.key} value={permission.key}>
                        {permission.key}
                      </option>
                    ))}
                </SelectField>
                <SelectField label={t('roles.scope')} value={selection.scope} onChange={(event) => setGrant({ ...grant, [role.id]: { ...selection, scope: event.target.value } })}>
                  <option value="HOSPITAL">{t('roles.hospitalScope')}</option>
                  <option value="DEPARTMENT">{t('roles.departmentScope')}</option>
                  <option value="OWN_RECORD">{t('roles.ownScope')}</option>
                </SelectField>
                <Button type="submit" disabled={pending || !selection.permission}>
                  {t('roles.grant')}
                </Button>
              </form>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}
