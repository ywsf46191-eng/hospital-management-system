'use client';

import type { DepartmentSummary, RoleSummary, TenantUser } from '@hospital/types';
import { Button } from '@hospital/ui';
import { type FormEvent, useState } from 'react';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, SelectField, Table, Td } from '@/components/ui';

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
        <p className="text-sm text-slate-600">Manage your own account from “My account”. Administrators cannot change their own access.</p>
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
    if (await action('POST', `${base}/password-reset`, { temporaryPassword }, 'Password reset. All sessions of this user were signed out.')) {
      setTemporaryPassword('');
    }
  }

  return (
    <>
      <ErrorText message={error} />
      {notice ? <p className="mb-4 text-sm text-emerald-700">{notice}</p> : null}

      {can('user.update') || can('user.disable') ? (
        <Card title="Access to this hospital">
          <div className="flex flex-wrap gap-2">
            {user.membershipStatus !== 'ACTIVE' && can('user.update') ? (
              <Button disabled={pending} onClick={() => action('POST', `${base}/activate`)}>
                Activate
              </Button>
            ) : null}
            {user.membershipStatus === 'ACTIVE' && can('user.disable') ? (
              <Button variant="secondary" disabled={pending} onClick={() => action('POST', `${base}/suspend`)}>
                Suspend
              </Button>
            ) : null}
            {user.membershipStatus !== 'DISABLED' && can('user.disable') ? (
              <Button variant="danger" disabled={pending} onClick={() => action('POST', `${base}/disable`)}>
                Disable
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {can('role.read') ? (
        <Card title="Roles">
          <Table headers={['Role', 'Department', 'Valid until', '']}>
            {user.roles.map((assignment) => (
              <tr key={assignment.id}>
                <Td>
                  {assignment.role.name} <span className="text-xs text-slate-500">({assignment.role.key})</span>
                </Td>
                <Td>{departments.find((department) => department.id === assignment.departmentId)?.name ?? (assignment.departmentId ? '—' : 'All')}</Td>
                <Td>{assignment.validUntil ? new Date(assignment.validUntil).toLocaleString() : '—'}</Td>
                <Td>
                  {can('role.assign') ? (
                    <Button variant="secondary" disabled={pending} onClick={() => action('DELETE', `${base}/roles/${assignment.id}`)}>
                      Remove
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
              <SelectField label="Role" required value={roleId} onChange={(event) => setRoleId(event.target.value)}>
                <option value="">Select a role…</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ))}
              </SelectField>
              <SelectField label="Department (optional)" value={roleDepartmentId} onChange={(event) => setRoleDepartmentId(event.target.value)}>
                <option value="">Whole hospital</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </SelectField>
              <Button type="submit" disabled={pending || !roleId}>
                Assign role
              </Button>
            </form>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">You can only assign roles whose permissions you hold yourself.</p>
        </Card>
      ) : null}

      <Card title="Departments">
        <ul className="mb-3 flex flex-wrap gap-2">
          {user.departments.map((department) => (
            <li key={department.id} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-sm">
              {department.name}
              {can('user.update') ? (
                <button type="button" className="text-red-700" disabled={pending} onClick={() => action('DELETE', `${base}/departments/${department.id}`)}>
                  ×
                </button>
              ) : null}
            </li>
          ))}
          {user.departments.length === 0 ? <li className="text-sm text-slate-500">No departments.</li> : null}
        </ul>
        {can('user.update') && departments.length > 0 ? (
          <form
            className="flex items-end gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await action('POST', `${base}/departments`, { departmentId })) setDepartmentId('');
            }}
          >
            <SelectField label="Add department" required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Select…</option>
              {departments
                .filter((department) => !user.departments.some((item) => item.id === department.id))
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </SelectField>
            <Button type="submit" disabled={pending || !departmentId}>
              Add
            </Button>
          </form>
        ) : null}
      </Card>

      {can('user.password_reset') ? (
        <Card title="Reset password">
          <form onSubmit={resetPassword} className="flex flex-col gap-3 sm:max-w-md">
            <Field
              label={`Temporary password (min ${me.passwordMinLength})`}
              type="password"
              autoComplete="new-password"
              required
              minLength={me.passwordMinLength}
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
            />
            <Button type="submit" variant="danger" disabled={pending}>
              Reset password
            </Button>
            <p className="text-xs text-slate-500">The user must change it at next sign-in. Shared accounts (several hospitals) are reset by a platform administrator.</p>
          </form>
        </Card>
      ) : null}
    </>
  );
}
