'use client';

import type { AuthMe } from '@hospital/types';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { apiCall, type ClientApiResult, describeError } from '@/lib/client-api';

interface SessionContextValue {
  me: AuthMe;
  can: (permission: string) => boolean;
  /** Mutating call with the CSRF token; refreshes server components on success. */
  mutate: <T = unknown>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) => Promise<ClientApiResult<T>>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ me, children }: { me: AuthMe; children: ReactNode }) {
  const router = useRouter();
  const permissions = useMemo(() => new Set(me.permissions), [me.permissions]);
  const can = useCallback((permission: string) => permissions.has(permission), [permissions]);
  const mutate = useCallback(
    async <T,>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) => {
      const result = await apiCall<T>(method, path, { body, csrfToken: me.csrfToken });
      if (result.ok) router.refresh();
      else if (result.status === 401) window.location.assign('/login');
      return result;
    },
    [me.csrfToken, router],
  );
  return <SessionContext.Provider value={{ me, can, mutate }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

/** Small helper for forms: tracks pending state and the last error message. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (action: () => Promise<ClientApiResult<unknown>>) => {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (!result.ok) setError(describeError(result.error));
    return result.ok;
  }, []);
  return { pending, error, run };
}
