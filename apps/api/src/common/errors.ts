import { HttpStatus } from '@nestjs/common';

/** Stable machine-readable error codes (API_SPECIFICATION.md §14). */
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'ACCESS_DENIED'
  | 'TENANT_ACCESS_DENIED'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'PASSWORD_POLICY_VIOLATION'
  | 'CSRF_INVALID'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_CONFLICT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: HttpStatus,
    message: string,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError('RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND, `${resource} was not found.`);
  }

  static conflict(message: string): AppError {
    return new AppError('RESOURCE_CONFLICT', HttpStatus.CONFLICT, message);
  }

  static forbidden(message = 'You are not allowed to perform this action.'): AppError {
    return new AppError('ACCESS_DENIED', HttpStatus.FORBIDDEN, message);
  }
}
