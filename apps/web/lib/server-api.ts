import type { ApiErrorBody, ApiErrorResponse, AuthMe } from '@hospital/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { apiInternalBaseUrl } from './api-base';

export interface ServerApiResult<T> {
  status: number;
  data: T | null;
  error: ApiErrorBody | null;
}

/** Server-side GET that forwards the caller's session cookie to the API. */
export async function serverGet<T>(path: string): Promise<ServerApiResult<T>> {
  const cookieHeader = (await cookies()).toString();
  try {
    const response = await fetch(`${apiInternalBaseUrl()}${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
    });
    const body = (await response.json().catch(() => null)) as
      | { success: true; data: T }
      | ApiErrorResponse
      | null;
    if (body && body.success) return { status: response.status, data: body.data, error: null };
    return { status: response.status, data: null, error: body && !body.success ? body.error : null };
  } catch {
    return { status: 502, data: null, error: { code: 'INTERNAL_ERROR', message: 'The API is unreachable.', details: null } };
  }
}

/** Loads the current session (once per request) or redirects to the sign-in page. */
export const requireSession = cache(async (): Promise<AuthMe> => {
  const me = await serverGet<AuthMe>('/auth/me');
  if (!me.data) redirect('/login');
  return me.data;
});

/** Loads data for a page; 401 sends the user to sign in, other errors are returned for display. */
export async function loadPageData<T>(path: string): Promise<ServerApiResult<T>> {
  const result = await serverGet<T>(path);
  if (result.status === 401) redirect('/login');
  return result;
}
