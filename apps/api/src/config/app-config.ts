import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
      message: 'must be a PostgreSQL connection URL',
    }),
  REDIS_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('redis://') || value.startsWith('rediss://'), {
      message: 'must be a Redis connection URL',
    }),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: booleanString,
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/, 'must be a valid S3 bucket name'),
  TRUST_PROXY: z.string().default('loopback'),
  AUTH_PROVIDER: z.enum(['local']).default('local'),
  AUTH_MFA_MODE: z.enum(['disabled']).default('disabled'),
  AUTH_PASSWORD_MIN_LENGTH: z.coerce.number().int().min(12).max(128).default(12),
  AUTH_LOCKOUT_THRESHOLD: z.coerce.number().int().min(1).max(100).default(5),
  AUTH_LOCKOUT_DURATION_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).max(86_400).default(900),
  AUTH_RATE_LIMIT_MAX_PER_IP: z.coerce.number().int().min(1).default(100),
  AUTH_RATE_LIMIT_MAX_PER_USERNAME: z.coerce.number().int().min(1).default(20),
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
  SESSION_ABSOLUTE_LIFETIME_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  SESSION_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  apiPort: number;
  corsOrigins: string[];
  database: { url: string };
  redis: { url: string };
  objectStorage: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  /** Express `trust proxy` setting: false, a hop count, or a list of trusted addresses/subnets. */
  trustProxy: boolean | number | string;
  auth: {
    provider: 'local';
    mfaMode: 'disabled';
    passwordMinLength: number;
    lockoutThreshold: number;
    lockoutDurationMs: number;
    rateLimit: { windowSeconds: number; maxPerIp: number; maxPerUsername: number };
  };
  session: {
    idleTimeoutMs: number;
    absoluteLifetimeMs: number;
    cookieSecure: boolean;
  };
}

function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'false') return false;
  if (value === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

export class ConfigValidationError extends Error {
  constructor(public readonly invalidKeys: string[]) {
    // Only variable names are reported; values may contain secrets.
    super(`Invalid or missing environment variables: ${invalidKeys.join(', ')}`);
    this.name = 'ConfigValidationError';
  }
}

export function parseAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new ConfigValidationError(keys);
  }
  const value = result.data;
  if (value.NODE_ENV === 'production' && !value.SESSION_COOKIE_SECURE) {
    throw new ConfigValidationError(['SESSION_COOKIE_SECURE']);
  }
  return {
    nodeEnv: value.NODE_ENV,
    apiPort: value.API_PORT,
    corsOrigins: value.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    database: { url: value.DATABASE_URL },
    redis: { url: value.REDIS_URL },
    objectStorage: {
      endpoint: value.MINIO_ENDPOINT,
      port: value.MINIO_PORT,
      useSSL: value.MINIO_USE_SSL,
      accessKey: value.MINIO_ACCESS_KEY,
      secretKey: value.MINIO_SECRET_KEY,
      bucket: value.MINIO_BUCKET,
    },
    trustProxy: parseTrustProxy(value.TRUST_PROXY),
    auth: {
      provider: value.AUTH_PROVIDER,
      mfaMode: value.AUTH_MFA_MODE,
      passwordMinLength: value.AUTH_PASSWORD_MIN_LENGTH,
      lockoutThreshold: value.AUTH_LOCKOUT_THRESHOLD,
      lockoutDurationMs: value.AUTH_LOCKOUT_DURATION_MINUTES * 60_000,
      rateLimit: {
        windowSeconds: value.AUTH_RATE_LIMIT_WINDOW_SECONDS,
        maxPerIp: value.AUTH_RATE_LIMIT_MAX_PER_IP,
        maxPerUsername: value.AUTH_RATE_LIMIT_MAX_PER_USERNAME,
      },
    },
    session: {
      idleTimeoutMs: value.SESSION_IDLE_TIMEOUT_MINUTES * 60_000,
      absoluteLifetimeMs: value.SESSION_ABSOLUTE_LIFETIME_HOURS * 3_600_000,
      cookieSecure: value.SESSION_COOKIE_SECURE,
    },
  };
}
