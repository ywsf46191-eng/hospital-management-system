import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthPrincipal } from './principal';

export const IS_PUBLIC = 'access:public';
export const AUTHENTICATED_ONLY = 'access:authenticated';
export const REQUIRED_PERMISSIONS = 'access:permissions';
export const ALLOW_PENDING_PASSWORD_CHANGE = 'access:allow-pending-password-change';

/** Opts a route out of authentication. Every other route is authenticated and default-deny. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Any authenticated user (own account/session operations only). */
export const Authenticated = () => SetMetadata(AUTHENTICATED_ONLY, true);

/** All listed permissions are required (evaluated by PermissionService.can). */
export const RequirePermission = (...permissions: string[]) => SetMetadata(REQUIRED_PERMISSIONS, permissions);

/** Reachable while the user must still replace a temporary password. */
export const AllowPendingPasswordChange = () => SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE, true);

export const Principal = createParamDecorator((_data: unknown, context: ExecutionContext): AuthPrincipal => {
  const request = context.switchToHttp().getRequest<Request & { principal?: AuthPrincipal }>();
  if (!request.principal) {
    throw new Error('Principal requested on a route without authentication');
  }
  return request.principal;
});
