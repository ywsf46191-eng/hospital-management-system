import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import type { HealthIndicator } from '../health/health-indicator';

/**
 * Single PrismaClient for the process. Connection is lazy so the API can start
 * (and report a degraded health state) while PostgreSQL is unavailable.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, HealthIndicator {
  readonly component = 'database' as const;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super({ datasourceUrl: config.database.url, log: ['warn', 'error'] });
  }

  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
