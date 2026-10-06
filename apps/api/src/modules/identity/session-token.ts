import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'hospital_session';
export const CSRF_HEADER = 'x-csrf-token';

/** 256-bit opaque session token. Only its hash is persisted. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * CSRF token bound to the session (synchronizer pattern without server state): an HMAC keyed by
 * the secret session token. It cannot be derived without the HttpOnly cookie value.
 */
export function deriveCsrfToken(sessionToken: string): string {
  return createHmac('sha256', sessionToken).update('csrf:v1').digest('base64url');
}

export function csrfTokenMatches(sessionToken: string, candidate: string | undefined): boolean {
  if (!candidate) return false;
  const expected = Buffer.from(deriveCsrfToken(sessionToken));
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
