import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@hospital/types';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { AppError, type ErrorCode } from './errors';
import { getRequestContext } from './request-context';

const STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'AUTH_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'ACCESS_DENIED',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'RESOURCE_CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'VALIDATION_ERROR',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

/** Standard error envelope (API_SPECIFICATION.md §13). Never exposes stack traces or internals. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = getRequestContext()?.requestId;
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown = null;

    if (exception instanceof AppError) {
      ({ status, code, message, details } = exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR');
      message = status >= 500 ? message : exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      code = 'RESOURCE_CONFLICT';
      message = 'A record with the same unique value already exists.';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      code = 'RESOURCE_NOT_FOUND';
      message = 'Resource was not found.';
    } else {
      this.logger.error(
        `Unhandled error (requestId=${requestId ?? '-'}): ${(exception as Error)?.name ?? 'unknown'}`,
        (exception as Error)?.stack,
      );
    }

    if (response.headersSent) return;
    const body: ApiErrorResponse = { success: false, error: { code, message, details }, requestId };
    response.status(status).json(body);
  }
}
