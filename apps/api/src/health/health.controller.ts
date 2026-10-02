import { Controller, Get } from '@nestjs/common';
import type { ApiSuccessResponse, HealthPayload } from '@hospital/types';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): ApiSuccessResponse<HealthPayload> {
    return {
      success: true,
      data: this.healthService.getHealth(),
    };
  }
}
