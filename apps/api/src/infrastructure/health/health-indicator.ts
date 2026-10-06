import type { HealthComponentName } from '@hospital/types';

/**
 * Implemented by infrastructure adapters so the health module can probe them
 * without depending on concrete clients (Prisma, ioredis, MinIO SDK).
 */
export interface HealthIndicator {
  readonly component: Exclude<HealthComponentName, 'application'>;
  /** Resolves when the dependency is reachable; rejects otherwise. */
  ping(): Promise<void>;
}

export const HEALTH_INDICATORS = Symbol('HEALTH_INDICATORS');
