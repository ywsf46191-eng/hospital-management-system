'use client';

import type { DepartmentSummary, RoleSummary, TenantUser } from '@hospital/types';
import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, SelectField, Table, Td } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/i18n/translate';

export function UserAdminPanel({
  user,
  roles,
  departments,
  isSelf,
}: {
  user: TenantUser;
  roles: RoleSummary[];
  departments: DepartmentSummary[];
  isSelf: boolean;
}) {
  const { t, locale } = useI18n();
  const { can, mutate, me } = useSession();
  const { pending, error, run } = useAction();
  const [roleId, setRoleId] = useState('');
  const [roleDepartmentId, setRoleDepartmentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const base = `/users/${user.id}`;

  if (isSelf) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">{t('users.selfManage')}</p>
      </Card>
    );
  }

  async function action(method: 'POST' | 'DELETE', path: string, body?: unknown, message?: string) {
    setNotice(null);
    const ok = await run(() => mutate(method, path, body));
    if (ok && message) setNotice(message);
    return ok;
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (await action('POST', `${base}/password-reset`, { temporaryPassword }, t('users.resetPassword'))) {
      setTemporaryPassword('');
    }
  }

  return (
    <>
      <ErrorText message={error} />
      {notice ? <p className="mb-4 text-sm text-success">{notice}</p> : null}

      {can('user.update') || can('user.disable') ? (
        <Card title={t('users.hospitalAccess')}>
          <div className="flex flex-wrap gap-2">
            {user.membershipStatus !== 'ACTIVE' && can('user.update') ? (
              <Button disabled={pending} onClick={() => action('POST', `${base}/activate`)}>
                {t('users.activate')}
              </Button>
            ) : null}
            {user.membershipStatus === 'ACTIVE' && can('user.disable') ? (
              <Button variant="secondary" disabled={pending} onClick={() => action('POST', `${base}/suspend`)}>
                {t('users.suspend')}
              </Button>
            ) : null}
            {user.membershipStatus !== 'DISABLED' && can('user.disable') ? (
              <Button variant="destructive" disabled={pending} onClick={() => action('POST', `${base}/disable`)}>
                {t('users.disable')}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {can('role.read') ? (
        <Card title={t('users.roles')}>
          <Table headers={[t('users.role'), t('users.department'), t('users.validUntil'), '']}>
            {user.roles.map((assignment) => (
              <tr key={assignment.id}>
                <Td>
                  {assignment.role.name} <span className="text-xs text-muted-foreground">({assignment.role.key})</span>
                </Td>
                <Td>{departments.find((department) => department.id === assignment.departmentId)?.name ?? (assignment.departmentId ? '—' : t('users.allHospital'))}</Td>
                <Td>{assignment.validUntil ? formatDateTime(assignment.validUntil, locale) : '—'}</Td>
                <Td>
                  {can('role.assign') ? (
                    <Button variant="secondary" disabled={pending} onClick={() => action('DELETE', `${base}/roles/${assignment.id}`)}>
                      {t('users.remove')}
                    </Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Table>
          {can('role.assign') ? (
            <form
              className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (await action('POST', `${base}/roles`, { roleId, ...(roleDepartmentId ? { departmentId: roleDepartmentId } : {}) })) setRoleId('');
              }}
            >
              <SelectField label={t('users.role')} required value={roleId} onChange={(event) => setRoleId(event.target.value)}>
                <option value="">{t('users.selectRole')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ))}
              </SelectField>
              <SelectField label={t('users.department')} value={roleDepartmentId} onChange={(event) => setRoleDepartmentId(event.target.value)}>
                <option value="">{t('users.allHospital')}</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </SelectField>
              <Button type="submit" disabled={pending || !roleId}>
                {t('users.assignRole')}
              </Button>
            </form>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">{t('users.escalation')}</p>
        </Card>
      ) : null}

      <Card title={t('users.departments')}>
        <ul className="mb-3 flex flex-wrap gap-2">
          {user.departments.map((department) => (
            <li key={department.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
              {department.name}
              {can('user.update') ? (
                <button type="button" className="text-destructive" disabled={pending} onClick={() => action('DELETE', `${base}/departments/${department.id}`)}>
                  ×
                </button>
              ) : null}
            </li>
          ))}
          {user.departments.length === 0 ? <li className="text-sm text-muted-foreground">{t('users.noDepartments')}</li> : null}
        </ul>
        {can('user.update') && departments.length > 0 ? (
          <form
            className="flex items-end gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await action('POST', `${base}/departments`, { departmentId })) setDepartmentId('');
            }}
          >
            <SelectField label={t('users.addDepartment')} required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">{t('users.select')}</option>
              {departments
                .filter((department) => !user.departments.some((item) => item.id === department.id))
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </SelectField>
            <Button type="submit" disabled={pending || !departmentId}>
              {t('users.add')}
            </Button>
          </form>
        ) : null}
      </Card>

      {can('user.password_reset') ? (
        <Card title={t('users.resetPassword')}>
          <form onSubmit={resetPassword} className="flex max-w-md flex-col gap-3">
            <Field
              label={t('users.tempPassword', { min: me.passwordMinLength })}
              type="password"
              autoComplete="new-password"
              required
              minLength={me.passwordMinLength}
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
            />
            <Button type="submit" variant="destructive" disabled={pending}>
              {t('users.resetPassword')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('users.resetHelp')}</p>
          </form>
        </Card>
      ) : null}
    </>
  );
}
