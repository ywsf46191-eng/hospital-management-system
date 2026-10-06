'use client';

import type { MembershipSummary } from '@hospital/types';
import { useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import { ErrorText } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/client-api';
import { translateError } from '@/lib/i18n/translate';

export function HospitalSelector({
  memberships,
  activeTenantId,
  csrfToken,
}: {
  memberships: MembershipSummary[];
  activeTenantId: string | null;
  csrfToken: string;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function select(tenantId: string) {
    setPending(tenantId);
    setError(null);
    const result = await apiCall('POST', '/auth/tenant', { body: { tenantId }, csrfToken });
    setPending(null);
    if (result.ok) window.location.assign('/dashboard');
    else setError(translateError(t, result.error));
  }

  return (
    <div className="flex flex-col gap-3">
      {memberships.map((membership) => (
        <div key={membership.tenantId} className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium">{membership.hospital.name}</p>
            <p className="text-xs text-muted-foreground">{membership.hospital.code}</p>
          </div>
          {membership.tenantId === activeTenantId ? (
            <span className="text-sm font-semibold text-success">{t('auth.active')}</span>
          ) : (
            <Button onClick={() => select(membership.tenantId)} disabled={pending !== null}>
              {pending === membership.tenantId ? t('auth.switching') : t('auth.useHospital')}
            </Button>
          )}
        </div>
      ))}
      <ErrorText message={error} />
    </div>
  );
}
