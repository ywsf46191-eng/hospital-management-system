'use client';

import type { PlatformHospital } from '@hospital/types';
import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { useAction, useSession } from '@/components/session-context';
import { Card, ErrorText, Field, SelectField, StatusBadge, Table, Td } from '@/components/ui';
import { Button } from '@/components/ui/button';

const emptyAdmin = { username: '', displayName: '', email: '', temporaryPassword: '' };

export function HospitalsManager({ hospitals }: { hospitals: PlatformHospital[] }) {
  const { t } = useI18n();
  const { can, mutate, me } = useSession();
  const { pending, error, run } = useAction();
  const [hospital, setHospital] = useState({ code: '', name: '', type: 'PRIVATE' });
  const [adminFor, setAdminFor] = useState<string | null>(null);
  const [admin, setAdmin] = useState(emptyAdmin);
  const [notice, setNotice] = useState<string | null>(null);

  async function createHospital(event: FormEvent) {
    event.preventDefault();
    if (await run(() => mutate('POST', '/platform/hospitals', hospital))) setHospital({ code: '', name: '', type: 'PRIVATE' });
  }

  async function createAdmin(event: FormEvent) {
    event.preventDefault();
    if (!adminFor) return;
    const ok = await run(() =>
      mutate('POST', `/platform/hospitals/${adminFor}/administrators`, {
        username: admin.username,
        displayName: admin.displayName,
        temporaryPassword: admin.temporaryPassword,
        ...(admin.email ? { email: admin.email } : {}),
      }),
    );
    if (ok) {
      setNotice(t('hospitals.created', { username: admin.username }));
      setAdmin(emptyAdmin);
      setAdminFor(null);
    }
  }

  return (
    <>
      <ErrorText message={error} />
      {notice ? <p className="mb-4 text-sm text-success">{notice}</p> : null}
      {can('tenant.create') ? (
        <Card title={t('hospitals.create')}>
          <form onSubmit={createHospital} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
            <Field label={t('hospitals.code')} required value={hospital.code} onChange={(event) => setHospital({ ...hospital, code: event.target.value })} />
            <Field label={t('hospitals.name')} required value={hospital.name} onChange={(event) => setHospital({ ...hospital, name: event.target.value })} />
            <SelectField label={t('hospitals.type')} value={hospital.type} onChange={(event) => setHospital({ ...hospital, type: event.target.value })}>
              <option value="PRIVATE">{t('hospitals.private')}</option>
              <option value="GOVERNMENT">{t('hospitals.government')}</option>
              <option value="NON_PROFIT">{t('hospitals.nonprofit')}</option>
            </SelectField>
            <Button type="submit" disabled={pending}>
              {t('hospitals.create')}
            </Button>
          </form>
        </Card>
      ) : null}
      <Card>
        <Table headers={[t('hospitals.code'), t('hospitals.name'), t('hospitals.type'), t('hospitals.status'), '']}>
          {hospitals.map((item) => (
            <tr key={item.id}>
              <Td>{item.code}</Td>
              <Td>{item.name}</Td>
              <Td>{item.type}</Td>
              <Td>
                <StatusBadge status={item.status} />
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {can('tenant.admin.create') ? (
                    <Button variant="secondary" onClick={() => setAdminFor(item.id)}>
                      {t('hospitals.addAdmin')}
                    </Button>
                  ) : null}
                  {can('tenant.suspend') ? (
                    <Button
                      variant={item.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                      disabled={pending}
                      onClick={() => run(() => mutate('POST', `/platform/hospitals/${item.id}/status`, { status: item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }))}
                    >
                      {item.status === 'ACTIVE' ? t('hospitals.suspend') : t('hospitals.reactivate')}
                    </Button>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      {adminFor ? (
        <Card title={t('hospitals.newAdmin', { name: hospitals.find((item) => item.id === adminFor)?.name ?? '' })}>
          <form onSubmit={createAdmin} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('auth.username')} required value={admin.username} onChange={(event) => setAdmin({ ...admin, username: event.target.value })} />
            <Field label={t('account.displayName')} required value={admin.displayName} onChange={(event) => setAdmin({ ...admin, displayName: event.target.value })} />
            <Field label={t('users.emailOptional')} type="email" value={admin.email} onChange={(event) => setAdmin({ ...admin, email: event.target.value })} />
            <Field
              label={t('users.tempPassword', { min: me.passwordMinLength })}
              type="password"
              required
              autoComplete="new-password"
              minLength={me.passwordMinLength}
              value={admin.temporaryPassword}
              onChange={(event) => setAdmin({ ...admin, temporaryPassword: event.target.value })}
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {t('hospitals.createAdmin')}
              </Button>
              <Button variant="secondary" onClick={() => setAdminFor(null)}>
                {t('hospitals.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </>
  );
}
