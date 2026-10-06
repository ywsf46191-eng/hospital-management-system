'use client';

import type { MembershipSummary } from '@hospital/types';
import { Button } from '@hospital/ui';
import { useState } from 'react';
import { ErrorText } from '@/components/ui';
import { apiCall, describeError } from '@/lib/client-api';

export function HospitalSelector({
  memberships,
  activeTenantId,
  csrfToken,
}: {
  memberships: MembershipSummary[];
  activeTenantId: string | null;
  csrfToken: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function select(tenantId: string) {
    setPending(tenantId);
    setError(null);
    // The server validates the membership; the client only names one of its own memberships.
    const result = await apiCall('POST', '/auth/tenant', { body: { tenantId }, csrfToken });
    setPending(null);
    if (result.ok) window.location.assign('/dashboard');
    else setError(describeError(result.error));
  }

  return (
    <div className="flex flex-col gap-3">
      {memberships.map((membership) => (
        <div key={membership.tenantId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <div>
            <p className="font-medium">{membership.hospital.name}</p>
            <p className="text-xs text-slate-500">{membership.hospital.code}</p>
          </div>
          {membership.tenantId === activeTenantId ? (
            <span className="text-sm font-semibold text-emerald-700">Active</span>
          ) : (
            <Button onClick={() => select(membership.tenantId)} disabled={pending !== null}>
              {pending === membership.tenantId ? 'Switching…' : 'Use this hospital'}
            </Button>
          )}
        </div>
      ))}
      <ErrorText message={error} />
    </div>
  );
}
