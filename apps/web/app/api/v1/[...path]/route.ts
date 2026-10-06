import type { NextRequest } from 'next/server';
import { apiInternalBaseUrl } from '@/lib/api-base';

export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy to the API so the session cookie stays first-party (HttpOnly, SameSite) and the
 * browser never needs the API's address. The API still enforces authentication, CSRF and Origin.
 * `x-forwarded-for` is appended by the Next.js server; the API trusts it only from TRUST_PROXY hops.
 */
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'content-type',
  'cookie',
  'origin',
  'user-agent',
  'x-csrf-token',
  'x-forwarded-for',
  'x-request-id',
];
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'x-request-id'];

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  if (path.some((segment) => segment === '..' || segment.includes('/'))) {
    return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid path.' } }, { status: 400 });
  }
  const target = `${apiInternalBaseUrl()}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'The API is unreachable.' } },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);
  responseHeaders.set('cache-control', 'no-store');

  const body = upstream.status === 204 ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
