import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import type { HealthIndicator } from '../health/health-indicator';

const ERROR_LOG_INTERVAL_MS = 30_000;

/**
 * Owns the shared Redis connection. Future cache, BullMQ, sync-queue and
 * notification adapters obtain connections from here instead of creating their own.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy, HealthIndicator {
  readonly component = 'redis' as const;
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private lastErrorLoggedAt = 0;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = new Redis(config.redis.url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
    });
    this.client.on('error', (error: Error) => {
      const now = Date.now();
      if (now - this.lastErrorLoggedAt > ERROR_LOG_INTERVAL_MS) {
        this.lastErrorLoggedAt = now;
        this.logger.warn(`Redis connection error: ${error.name}`);
      }
    });
  }

  /**
   * Connects at startup so the shared connection is usable immediately. A Redis outage must not
   * prevent the API from starting: the failure is logged and ioredis keeps reconnecting.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn(`Redis unavailable at startup: ${(error as Error).name}`);
    }
  }

  /** Shared command connection. Do not use for blocking commands or subscriptions. */
  get connection(): Redis {
    return this.client;
  }

  /** Dedicated connection for blocking consumers (e.g. BullMQ workers, pub/sub). Caller owns it. */
  createDedicatedConnection(): Redis {
    return this.client.duplicate({ lazyConnect: false, maxRetriesPerRequest: null });
  }

  async ping(): Promise<void> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }
    const reply = await this.client.ping();
    if (reply !== 'PONG') {
      throw new Error('Unexpected Redis PING reply');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end' && this.client.status !== 'wait') {
      await this.client.quit().catch(() => this.client.disconnect());
    } else {
      this.client.disconnect();
    }
  }
}
