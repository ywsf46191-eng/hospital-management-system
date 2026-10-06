'use client';

import type { DepartmentSummary } from '@hospital/types';
import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, StatusBadge, Table, Td } from '@/components/ui';
import { Button } from '@/components/ui/button';

export function DepartmentsManager({ departments }: { departments: DepartmentSummary[] }) {
  const { t } = useI18n();
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
        <Card title={t('departments.create')}>
          <form onSubmit={create} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
            <Field label={t('departments.code')} required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            <Field label={t('departments.name')} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Button type="submit" disabled={pending}>
              {t('departments.create')}
            </Button>
          </form>
        </Card>
      ) : null}
      <Card>
        <Table headers={[t('departments.code'), t('departments.name'), t('departments.status'), '']}>
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
                    {t('departments.disable')}
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
