import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context. Populated by RequestContextMiddleware (request metadata) and by the
 * authentication guard (identity and tenant). The tenant is always taken from the server-side
 * session, never from client input.
 */
export interface RequestContext {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId?: string;
  sessionId?: string;
  tenantId?: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Runs internal (non-HTTP) work with an explicit tenant, e.g. CLI tooling and tests. */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  const parent = storage.getStore();
  return storage.run(
    { requestId: parent?.requestId ?? 'internal', ipAddress: null, userAgent: null, ...parent, tenantId },
    fn,
  );
}
