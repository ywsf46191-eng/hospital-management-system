import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HEALTH_CHECK_TIMEOUT_MS, HealthService } from '../../src/health/health.service';
import type { HealthIndicator } from '../../src/infrastructure/health/health-indicator';

function indicator(
  component: HealthIndicator['component'],
  ping: () => Promise<void>,
): HealthIndicator {
  return { component, ping };
}

describe('HealthService', () => {
  it('reports ok when every dependency responds', async () => {
    const service = new HealthService([
      indicator('database', async () => undefined),
      indicator('redis', async () => undefined),
      indicator('objectStorage', async () => undefined),
    ]);

    const result = await service.check();

    assert.equal(result.status, 'ok');
    assert.equal(result.checks.application.status, 'up');
    assert.equal(result.checks.database.status, 'up');
    assert.equal(result.checks.redis.status, 'up');
    assert.equal(result.checks.objectStorage.status, 'up');
  });

  it('reports degraded and a generic error code without leaking driver messages', async () => {
    const secretMessage = 'connect ECONNREFUSED postgres://admin:s3cret@10.0.0.5:5432';
    const service = new HealthService([
      indicator('database', async () => {
        throw Object.assign(new Error(secretMessage), { code: 'ECONNREFUSED' });
      }),
      indicator('redis', async () => undefined),
      indicator('objectStorage', async () => {
        throw new Error('bucket missing');
      }),
    ]);

    const result = await service.check();
    const serialized = JSON.stringify(result);

    assert.equal(result.status, 'degraded');
    assert.deepEqual(result.checks.database, {
      status: 'down',
      latencyMs: result.checks.database.latencyMs,
      error: 'UNREACHABLE',
    });
    assert.equal(result.checks.objectStorage.error, 'CHECK_FAILED');
    assert.equal(result.checks.redis.status, 'up');
    assert.ok(!serialized.includes('s3cret'));
    assert.ok(!serialized.includes('10.0.0.5'));
  });

  it('times out a hanging dependency', { timeout: HEALTH_CHECK_TIMEOUT_MS + 2_000 }, async () => {
    const service = new HealthService([
      indicator('redis', () => new Promise<void>(() => undefined)),
    ]);

    const result = await service.check();

    assert.equal(result.status, 'degraded');
    assert.equal(result.checks.redis.error, 'TIMEOUT');
  });
});
