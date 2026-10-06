// Requires running infrastructure (docker compose up -d --wait) and applied migrations.
import { loadRootEnv } from '../../src/config/load-env';
loadRootEnv(__dirname);

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ApiSuccessResponse, HealthPayload } from '@hospital/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { RedisService } from '../../src/infrastructure/redis/redis.service';
import { ObjectStorage } from '../../src/infrastructure/storage/object-storage';

const TEST_PREFIX = `integration-test/${randomUUID()}`;

describe('API infrastructure connectivity', () => {
  let app: INestApplication;
  let baseUrl: string;

  before(async () => {
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;
  });

  after(async () => {
    await app?.close();
  });

  it('API -> PostgreSQL: executes queries and sees applied migrations', async () => {
    const prisma = app.get(PrismaService);

    const [row] = await prisma.$queryRaw<
      { version: string }[]
    >`SELECT current_setting('server_version') AS version`;
    assert.match(row?.version ?? '', /^17\./, 'expected PostgreSQL 17');

    const migrations = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
    assert.ok(Number(migrations[0]?.count ?? 0) >= 1, 'expected at least one applied migration');

    const sum = await prisma.$transaction(async (tx) => {
      const [result] = await tx.$queryRaw<{ total: number }[]>`SELECT (20 + 22)::int AS total`;
      return result?.total;
    });
    assert.equal(sum, 42);
  });

  it('API -> Redis: writes, reads and expires a key', async () => {
    const redis = app.get(RedisService).connection;
    const key = `${TEST_PREFIX}:redis`;

    await redis.set(key, 'hello', 'EX', 30);
    assert.equal(await redis.get(key), 'hello');
    const ttl = await redis.ttl(key);
    assert.ok(ttl > 0 && ttl <= 30);

    await redis.del(key);
    assert.equal(await redis.get(key), null);
  });

  it('API -> MinIO: uploads, downloads and deletes an object', async () => {
    const storage = app.get(ObjectStorage);
    const key = `${TEST_PREFIX}/probe.txt`;
    const body = Buffer.from(`synthetic infrastructure probe ${randomUUID()}`);

    await storage.putObject(key, body, 'text/plain');
    const downloaded = await storage.getObject(key);
    assert.ok(downloaded.equals(body));

    await storage.removeObject(key);
    await assert.rejects(() => storage.getObject(key));
  });

  it('GET /health reports every component up', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = (await response.json()) as ApiSuccessResponse<HealthPayload>;

    assert.equal(response.status, 200);
    assert.equal(body.data.status, 'ok');
    for (const name of ['application', 'database', 'redis', 'objectStorage'] as const) {
      assert.equal(body.data.checks[name].status, 'up', `${name} should be up`);
    }
  });
});
