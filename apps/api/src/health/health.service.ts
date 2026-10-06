import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_NAME } from '@hospital/config';
import type {
  HealthComponentName,
  HealthComponentResult,
  HealthErrorCode,
  HealthPayload,
} from '@hospital/types';
import { HEALTH_INDICATORS, type HealthIndicator } from '../infrastructure/health/health-indicator';

export const HEALTH_CHECK_TIMEOUT_MS = 3_000;
const API_VERSION = '0.1.0';

class HealthCheckTimeoutError extends Error {}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(HEALTH_INDICATORS) private readonly indicators: HealthIndicator[]) {}

  async check(): Promise<HealthPayload> {
    const results = await Promise.all(
      this.indicators.map(async (indicator) => [indicator.component, await this.probe(indicator)] as const),
    );

    const checks = {
      application: { status: 'up', latencyMs: 0 },
      ...Object.fromEntries(results),
    } as Record<HealthComponentName, HealthComponentResult>;

    const anyDown = results.some(([, result]) => result.status === 'down');

    return {
      status: anyDown ? 'degraded' : 'ok',
      service: APP_NAME,
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      checks,
    };
  }

  private async probe(indicator: HealthIndicator): Promise<HealthComponentResult> {
    const startedAt = performance.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        indicator.ping(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new HealthCheckTimeoutError()), HEALTH_CHECK_TIMEOUT_MS);
        }),
      ]);
      return { status: 'up', latencyMs: elapsed(startedAt) };
    } catch (error) {
      const code: HealthErrorCode =
        error instanceof HealthCheckTimeoutError ? 'TIMEOUT' : classify(error);
      // Log the error class only; driver messages can include hosts or connection details.
      this.logger.warn(`Health check failed for ${indicator.component}: ${code} (${errorName(error)})`);
      return { status: 'down', latencyMs: elapsed(startedAt), error: code };
    } finally {
      clearTimeout(timer);
    }
  }
}

function elapsed(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

function classify(error: unknown): HealthErrorCode {
  const code = (error as { code?: unknown } | null)?.code;
  const unreachable = ['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH', 'ECONNRESET', 'ETIMEDOUT', 'P1001'];
  if (typeof code === 'string' && unreachable.includes(code)) return 'UNREACHABLE';
  const name = errorName(error);
  if (name === 'PrismaClientInitializationError') return 'UNREACHABLE';
  return 'CHECK_FAILED';
}
