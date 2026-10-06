import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { readCookie } from '../../common/cookies';
import { AppError } from '../../common/errors';
import { getRequestContext } from '../../common/request-context';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import { AuditService } from '../audit/audit.service';
import { SessionCookie } from '../identity/session-cookie';
import { CSRF_HEADER, csrfTokenMatches, SESSION_COOKIE } from '../identity/session-token';
import { SessionService } from '../identity/session.service';
import {
  ALLOW_PENDING_PASSWORD_CHANGE,
  AUTHENTICATED_ONLY,
  IS_PUBLIC,
  REQUIRED_PERMISSIONS,
} from './decorators';
import { PermissionService } from './permission.service';
import type { AuthPrincipal } from './principal';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type GuardedRequest = Request & { principal?: AuthPrincipal };

/**
 * Global guard: authentication → CSRF → password-change gate → authorization.
 * Default deny: a route is reachable only if it is @Public(), @Authenticated(), or declares
 * @RequirePermission(); a protected route without authorization metadata is rejected.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  private readonly logger = new Logger(AccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly sessionCookie: SessionCookie,
    private readonly permissions: PermissionService,
    private readonly audit: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return false;
    const request = context.switchToHttp().getRequest<GuardedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const targets = [context.getHandler(), context.getClass()];
    const unsafe = !SAFE_METHODS.has(request.method);

    if (unsafe) this.assertAllowedOrigin(request);
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    const validation = await this.sessions.validate(token);
    if (validation.status !== 'valid') {
      if (token) this.sessionCookie.clear(response);
      throw validation.status === 'expired'
        ? new AppError('AUTH_EXPIRED', HttpStatus.UNAUTHORIZED, 'The session has expired.')
        : new AppError('AUTH_REQUIRED', HttpStatus.UNAUTHORIZED, 'Authentication is required.');
    }
    const { session } = validation;
    const principal: AuthPrincipal = {
      userId: session.userId,
      sessionId: session.id,
      tenantId: session.tenantId,
      session,
      sessionToken: token as string,
    };
    request.principal = principal;
    const requestContext = getRequestContext();
    if (requestContext) {
      requestContext.userId = session.userId;
      requestContext.sessionId = session.id;
      requestContext.tenantId = session.tenantId;
    }

    if (unsafe && !csrfTokenMatches(principal.sessionToken, request.header(CSRF_HEADER))) {
      await this.audit.recordSafely({
        action: 'CSRF_REJECTED',
        category: 'AUTHZ',
        result: 'DENIED',
        metadata: { method: request.method, route: this.routeOf(request) },
      });
      throw new AppError('CSRF_INVALID', HttpStatus.FORBIDDEN, 'Missing or invalid CSRF token.');
    }

    if (session.passwordChangeRequired && !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_CHANGE, targets)) {
      throw new AppError('PASSWORD_CHANGE_REQUIRED', HttpStatus.FORBIDDEN, 'The password must be changed first.');
    }

    const required = this.reflector.getAllAndOverride<string[] | undefined>(REQUIRED_PERMISSIONS, targets);
    if (!required || required.length === 0) {
      if (this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_ONLY, targets)) return true;
      this.logger.error(`Route without authorization metadata denied: ${request.method} ${this.routeOf(request)}`);
      throw AppError.forbidden();
    }

    for (const permission of required) {
      const decision = await this.permissions.can(principal, permission);
      if (!decision.allowed) {
        await this.audit.recordSafely({
          action: 'PERMISSION_DENIED',
          category: 'AUTHZ',
          result: 'DENIED',
          reason: decision.reason,
          metadata: { permission, method: request.method, route: this.routeOf(request) },
        });
        if (decision.reason === 'TENANT_CONTEXT_REQUIRED') {
          throw new AppError('TENANT_CONTEXT_REQUIRED', HttpStatus.FORBIDDEN, 'An active hospital must be selected.');
        }
        throw AppError.forbidden();
      }
    }
    return true;
  }

  /** Cross-site request protection for cookie authentication, including the public login route. */
  private assertAllowedOrigin(request: Request): void {
    const origin = request.header('origin');
    if (origin && !this.config.corsOrigins.includes(origin)) {
      throw new AppError('CSRF_INVALID', HttpStatus.FORBIDDEN, 'Request origin is not allowed.');
    }
  }

  private routeOf(request: Request): string {
    return (request.route as { path?: string } | undefined)?.path ?? request.path;
  }
}
