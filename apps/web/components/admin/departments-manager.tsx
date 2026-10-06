'use client';

import type { DepartmentSummary } from '@hospital/types';
import { Button } from '@hospital/ui';
import { type FormEvent, useState } from 'react';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, StatusBadge, Table, Td } from '@/components/ui';

export function DepartmentsManager({ departments }: { departments: DepartmentSummary[] }) {
  const { can, mutate } = useSession();
  const { pending, error, run } = useAction();
  const [form, setForm] = useState({ code: '', name: '' });

  async function create(event: FormEvent) {
    event.preventDefault();
    if (await run(() => mutate('POST', '/departments', form))) setForm({ code: '', name: '' });
  }

  return (
    <>
      <ErrorText message={error} />
      {can('department.create') ? (
        <Card title="Create department">
          <form onSubmit={create} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
            <Field label="Code" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            <Field label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Button type="submit" disabled={pending}>
              Create
            </Button>
          </form>
        </Card>
      ) : null}
      <Card>
        <Table headers={['Code', 'Name', 'Status', '']}>
          {departments.map((department) => (
            <tr key={department.id}>
              <Td>{department.code}</Td>
              <Td>{department.name}</Td>
              <Td>
                <StatusBadge status={department.status} />
              </Td>
              <Td>
                {department.status === 'ACTIVE' && can('department.disable') ? (
                  <Button variant="secondary" disabled={pending} onClick={() => run(() => mutate('POST', `/departments/${department.id}/disable`))}>
                    Disable
                  </Button>
                ) : null}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
