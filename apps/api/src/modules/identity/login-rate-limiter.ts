import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import { RedisService } from '../../infrastructure/redis/redis.service';

export type RateLimitDecision = { allowed: true } | { allowed: false; scope: 'ip' | 'username' };

/**
 * Fixed-window login attempt counters per client IP and per username (P3-D10).
 * Usernames are stored as SHA-256 digests. PostgreSQL account lockout remains the authoritative
 * per-account control, so a Redis outage fails open (logged) instead of blocking every login.
 */
@Injectable()
export class LoginRateLimiter {
  private readonly logger = new Logger(LoginRateLimiter.name);

  constructor(
    private readonly redis: RedisService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async consume(ip: string | null, username: string): Promise<RateLimitDecision> {
    const { windowSeconds, maxPerIp, maxPerUsername } = this.config.auth.rateLimit;
    const ipKey = `auth:login:ip:${ip ?? 'unknown'}`;
    const userKey = `auth:login:user:${createHash('sha256').update(username).digest('hex')}`;
    try {
      const results = await this.redis.connection
        .multi()
        .incr(ipKey)
        .expire(ipKey, windowSeconds, 'NX')
        .incr(userKey)
        .expire(userKey, windowSeconds, 'NX')
        .exec();
      const ipCount = Number(results?.[0]?.[1] ?? 0);
      const userCount = Number(results?.[2]?.[1] ?? 0);
      if (ipCount > maxPerIp) return { allowed: false, scope: 'ip' };
      if (userCount > maxPerUsername) return { allowed: false, scope: 'username' };
      return { allowed: true };
    } catch (error) {
      this.logger.warn(`Login rate limiter unavailable (failing open): ${(error as Error).name}`);
      return { allowed: true };
    }
  }
}
