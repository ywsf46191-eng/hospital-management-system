import { Injectable } from '@nestjs/common';
import type { HealthPayload } from '@hospital/types';
import { APP_NAME } from '@hospital/config';

@Injectable()
export class HealthService {
  getHealth(): HealthPayload {
    return {
      status: 'ok',
      service: APP_NAME,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
