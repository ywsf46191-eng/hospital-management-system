import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { ApiSuccessResponse, HealthPayload } from '@hospital/types';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Readiness: application plus PostgreSQL, Redis and object storage.
   * Returns 503 when any dependency is down so orchestrators can stop routing traffic.
   */
  @Get()
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<HealthPayload>> {
    const payload = await this.healthService.check();
    if (payload.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { success: true, data: payload };
  }

  /** Liveness: the process is running and serving HTTP. Does not touch dependencies. */
  @Get('live')
  getLiveness(): ApiSuccessResponse<{ status: 'ok' }> {
    return { success: true, data: { status: 'ok' } };
  }
}
