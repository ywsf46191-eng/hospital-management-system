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
  };
}
