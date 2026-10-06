import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigValidationError, parseAppConfig } from '../../src/config/app-config';

const validEnv = {
  DATABASE_URL: 'postgresql://hospital:pw@localhost:5432/hospital?schema=public',
  REDIS_URL: 'redis://:pw@localhost:6379/0',
  MINIO_ENDPOINT: 'localhost',
  MINIO_PORT: '9000',
  MINIO_USE_SSL: 'false',
  MINIO_ACCESS_KEY: 'hospital-app',
  MINIO_SECRET_KEY: 'secret-value',
  MINIO_BUCKET: 'hospital-local',
};

describe('parseAppConfig', () => {
  it('parses a valid environment', () => {
    const config = parseAppConfig({ ...validEnv, CORS_ORIGINS: 'http://a.local, http://b.local' });

    assert.equal(config.apiPort, 4000);
    assert.equal(config.objectStorage.port, 9000);
    assert.equal(config.objectStorage.useSSL, false);
    assert.deepEqual(config.corsOrigins, ['http://a.local', 'http://b.local']);
  });

  it('reports invalid variable names without exposing their values', () => {
    assert.throws(
      () =>
        parseAppConfig({
          ...validEnv,
          DATABASE_URL: 'mysql://root:topsecret@db/hospital',
          MINIO_SECRET_KEY: '',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ConfigValidationError);
        assert.deepEqual(error.invalidKeys.sort(), ['DATABASE_URL', 'MINIO_SECRET_KEY']);
        assert.ok(!error.message.includes('topsecret'));
        return true;
      },
    );
  });
});
