import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigValidationError, parseAppConfig } from '../../src/config/app-config';
import { redact } from '../../src/modules/audit/redact';
import { PasswordHasher } from '../../src/modules/identity/password-hasher';
import { passwordPolicyViolations } from '../../src/modules/identity/password-policy';
import {
  csrfTokenMatches,
  deriveCsrfToken,
  generateSessionToken,
  hashSessionToken,
  SESSION_TOKEN_PATTERN,
} from '../../src/modules/identity/session-token';

const baseEnv = {
  DATABASE_URL: 'postgresql://hospital:pw@localhost:5432/hospital?schema=public',
  REDIS_URL: 'redis://:pw@localhost:6379/0',
  MINIO_ENDPOINT: 'localhost',
  MINIO_PORT: '9000',
  MINIO_USE_SSL: 'false',
  MINIO_ACCESS_KEY: 'hospital-app',
  MINIO_SECRET_KEY: 'secret-value',
  MINIO_BUCKET: 'hospital-local',
};

describe('password policy', () => {
  it('enforces minimum length, variety and username exclusion', () => {
    assert.deepEqual(passwordPolicyViolations('correct horse battery', 12), []);
    assert.ok(passwordPolicyViolations('short', 12).length > 0);
    assert.ok(passwordPolicyViolations('aaaaaaaaaaaaaaaa', 12).length > 0);
    assert.ok(passwordPolicyViolations('            x', 12).length > 0);
    assert.ok(passwordPolicyViolations('my-name-is-alice-1', 12, 'alice').length > 0);
    assert.ok(passwordPolicyViolations('x'.repeat(300) + 'abcd', 12).length > 0);
  });
});

describe('password hashing', () => {
  it('uses Argon2id and verifies only the right password', async () => {
    const hasher = new PasswordHasher();
    const hash = await hasher.hash('a sufficiently long passphrase');
    assert.match(hash, /^\$argon2id\$/);
    assert.equal(await hasher.verify(hash, 'a sufficiently long passphrase'), true);
    assert.equal(await hasher.verify(hash, 'another long passphrase'), false);
    assert.equal(await hasher.verify('not-a-hash', 'anything'), false);
  });
});

describe('session tokens and CSRF', () => {
  it('generates high-entropy opaque tokens and stores only a hash', () => {
    const token = generateSessionToken();
    assert.match(token, SESSION_TOKEN_PATTERN);
    assert.notEqual(generateSessionToken(), token);
    assert.match(hashSessionToken(token), /^[0-9a-f]{64}$/);
    assert.notEqual(hashSessionToken(token), token);
  });

  it('binds the CSRF token to the session', () => {
    const token = generateSessionToken();
    const csrf = deriveCsrfToken(token);
    assert.equal(csrfTokenMatches(token, csrf), true);
    assert.equal(csrfTokenMatches(generateSessionToken(), csrf), false);
    assert.equal(csrfTokenMatches(token, undefined), false);
    assert.equal(csrfTokenMatches(token, `${csrf}x`), false);
  });
});

describe('audit redaction', () => {
  it('removes secrets at any depth', () => {
    const redacted = redact({
      username: 'alice',
      password: 'p',
      nested: { sessionToken: 't', passwordHash: 'h', list: [{ secret: 's', ok: 1 }] },
    });
    assert.deepEqual(redacted, {
      username: 'alice',
      password: '[REDACTED]',
      nested: { sessionToken: '[REDACTED]', passwordHash: '[REDACTED]', list: [{ secret: '[REDACTED]', ok: 1 }] },
    });
  });
});

describe('auth configuration', () => {
  it('applies the approved defaults', () => {
    const config = parseAppConfig(baseEnv);
    assert.equal(config.auth.passwordMinLength, 12);
    assert.equal(config.auth.lockoutThreshold, 5);
    assert.equal(config.auth.lockoutDurationMs, 15 * 60_000);
    assert.equal(config.session.idleTimeoutMs, 30 * 60_000);
    assert.equal(config.session.absoluteLifetimeMs, 12 * 3_600_000);
    assert.equal(config.session.cookieSecure, true);
    assert.equal(config.auth.provider, 'local');
    assert.equal(config.auth.mfaMode, 'disabled');
  });

  it('refuses insecure cookies in production and passwords shorter than 12', () => {
    assert.throws(
      () => parseAppConfig({ ...baseEnv, NODE_ENV: 'production', SESSION_COOKIE_SECURE: 'false' }),
      (error: unknown) => error instanceof ConfigValidationError && error.invalidKeys.includes('SESSION_COOKIE_SECURE'),
    );
    assert.throws(
      () => parseAppConfig({ ...baseEnv, AUTH_PASSWORD_MIN_LENGTH: '8' }),
      (error: unknown) => error instanceof ConfigValidationError && error.invalidKeys.includes('AUTH_PASSWORD_MIN_LENGTH'),
    );
  });
});
