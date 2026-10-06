import type { ApiErrorBody } from '@hospital/types';

export type ClientApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiErrorBody };

/**
 * Browser calls go through the same-origin proxy (/api/v1). The session cookie is HttpOnly and is
 * sent automatically; the CSRF token is held in memory only (never in localStorage).
 */
export async function apiCall<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; csrfToken?: string | null } = {},
): Promise<ClientApiResult<T>> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.csrfToken) headers['x-csrf-token'] = options.csrfToken;
  try {
    const response = await fetch(`/api/v1${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    const body = text ? (JSON.parse(text) as { success: boolean; data?: T; error?: ApiErrorBody }) : null;
    if (response.ok) return { ok: true, status: response.status, data: (body?.data ?? null) as T };
    return {
      ok: false,
      status: response.status,
      error: body?.error ?? { code: 'INTERNAL_ERROR', message: `Request failed (${response.status}).` },
    };
  } catch {
    return { ok: false, status: 0, error: { code: 'INTERNAL_ERROR', message: 'Network error.' } };
  }
}

/** Human-readable error including validation issues. */
export function describeError(error: ApiErrorBody): string {
  const details = error.details as { issues?: { path: string; message: string }[]; violations?: string[] } | null | undefined;
  const extra = [
    ...(details?.issues ?? []).map((issue) => `${issue.path || 'input'}: ${issue.message}`),
    ...(details?.violations ?? []),
  ];
  return extra.length > 0 ? `${error.message} (${extra.join('; ')})` : error.message;
}
