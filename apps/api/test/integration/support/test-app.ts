import { execFileSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';

/**
 * Creates a fresh `<database>_test` database and points DATABASE_URL at it, so security tests
 * never create accounts (e.g. platform administrators) in the development database.
 */
export async function prepareTestDatabase(): Promise<string> {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error('DATABASE_URL is not set');
  const url = new URL(baseUrl);
  const baseName = url.pathname.replace(/^\//, '');
  const testName = `${baseName}_test`;
  if (!/^[a-z0-9_]+$/.test(testName)) throw new Error(`Unsafe test database name: ${testName}`);

  const admin = new PrismaClient({ datasources: { db: { url: baseUrl } } });
  try {
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testName}" WITH (FORCE)`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${testName}"`);
  } finally {
    await admin.$disconnect();
  }

  url.pathname = `/${testName}`;
  const testUrl = url.toString();
  process.env.DATABASE_URL = testUrl;
  execFileSync(process.execPath, [join(__dirname, '..', '..', '..', '..', 'scripts', 'prisma.cjs'), 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  });
  return testUrl;
}

export interface TestApp {
  app: INestApplication;
  baseUrl: string;
}

export async function startTestApp(env: Record<string, string> = {}): Promise<TestApp> {
  Object.assign(process.env, env);
  // Imported lazily so configuration is parsed after the environment overrides are applied.
  const { AppModule } = await import('../../../src/app.module');
  const { configureApp } = await import('../../../src/bootstrap/configure-app');
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const { port } = app.getHttpServer().address() as AddressInfo;
  return { app, baseUrl: `http://127.0.0.1:${port}/api/v1` };
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  setCookies: string[];
}

/** Minimal browser-like client: keeps the session cookie and sends the CSRF header. */
export class ApiClient {
  sessionToken: string | null = null;
  csrfToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  async request<T = { success: boolean; data?: unknown; error?: { code: string; message: string } }>(
    method: string,
    path: string,
    options: { body?: unknown; headers?: Record<string, string>; csrf?: boolean | string } = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { ...options.headers };
    if (this.sessionToken) headers.cookie = `hospital_session=${this.sessionToken}`;
    if (options.body !== undefined) headers['content-type'] = 'application/json';
    const csrf = options.csrf ?? true;
    if (typeof csrf === 'string') headers['x-csrf-token'] = csrf;
    else if (csrf && this.csrfToken && !['GET', 'HEAD'].includes(method)) headers['x-csrf-token'] = this.csrfToken;

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      const match = /^hospital_session=([^;]*)/.exec(cookie);
      if (match) this.sessionToken = match[1] ? match[1] : null;
    }
    const text = await response.text();
    const body = (text ? JSON.parse(text) : null) as T;
    const data = (body as { data?: { csrfToken?: string } } | null)?.data;
    if (data && typeof data.csrfToken === 'string') this.csrfToken = data.csrfToken;
    return { status: response.status, body, setCookies };
  }

  login(username: string, password: string, headers: Record<string, string> = {}) {
    return this.request('POST', '/auth/login', { body: { username, password }, headers });
  }
}
