import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from './request-context';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const USER_AGENT_MAX_LENGTH = 512;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header('x-request-id');
    const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
    response.setHeader('X-Request-ID', requestId);
    runWithRequestContext(
      {
        requestId,
        ipAddress: request.ip ?? null,
        userAgent: request.header('user-agent')?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
      },
      next,
    );
  }
}
