import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthMe, SessionSummary } from '@hospital/types';
import { AppError } from '../../common/errors';
import { getRequestContext } from '../../common/request-context';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PermissionService } from '../access-control/permission.service';
import type { AuthPrincipal } from '../access-control/principal';
import { AuditService } from '../audit/audit.service';
import { IdentityProvider } from './identity-provider';
import { normalizeUsername } from './local-identity.provider';
import { LoginRateLimiter } from './login-rate-limiter';
import { MfaPolicy } from './mfa-policy';
import { PasswordPolicy } from './password-policy';
import { deriveCsrfToken } from './session-token';
import { SessionService } from './session.service';

/** One message for every login failure so responses do not reveal which check failed. */
const INVALID_LOGIN = 'Invalid username or password, or the account is not allowed to sign in.';

export interface IssuedSession {
  token: string;
  absoluteExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityProvider,
    private readonly sessions: SessionService,
    private readonly rateLimiter: LoginRateLimiter,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly permissions: PermissionService,
    private readonly mfa: MfaPolicy,
    private readonly audit: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async login(username: string, password: string): Promise<IssuedSession> {
    const context = getRequestContext();
    const normalized = normalizeUsername(username);

    const limit = await this.rateLimiter.consume(context?.ipAddress ?? null, normalized);
    if (!limit.allowed) {
      await this.audit.recordSafely({
        action: 'LOGIN_RATE_LIMITED',
        category: 'AUTH',
        result: 'DENIED',
        reason: `RATE_LIMIT_${limit.scope.toUpperCase()}`,
        tenantId: null,
      });
      throw new AppError('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS, 'Too many sign-in attempts. Try again later.');
    }

    const result = await this.identity.authenticate({ username: normalized, password });
    if (!result.ok) {
      if (result.userId) await this.registerFailure(result.userId, result.reason);
      else await this.loginFailed(null, result.reason);
      throw new AppError('AUTH_INVALID', HttpStatus.UNAUTHORIZED, INVALID_LOGIN);
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      select: { id: true, status: true, lockedUntil: true },
    });
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.loginFailed(user.id, 'ACCOUNT_LOCKED');
      throw new AppError('AUTH_INVALID', HttpStatus.UNAUTHORIZED, INVALID_LOGIN);
    }
    if (user.status !== 'ACTIVE') {
      await this.loginFailed(user.id, `USER_${user.status}`);
      throw new AppError('AUTH_INVALID', HttpStatus.UNAUTHORIZED, INVALID_LOGIN);
    }

    const memberships = await this.activeMemberships(user.id);
    const platformRoles = await this.prisma.platformRoleAssignment.count({
      where: { userId: user.id, role: { status: 'ACTIVE' } },
    });
    if (memberships.length === 0 && platformRoles === 0) {
      await this.loginFailed(user.id, 'NO_ACTIVE_ACCESS');
      throw new AppError('AUTH_INVALID', HttpStatus.UNAUTHORIZED, INVALID_LOGIN);
    }
    const tenantId = memberships.length === 1 ? (memberships[0]?.tenantId ?? null) : null;
    // MFA-ready: no factor exists yet (AUTH_MFA_MODE=disabled), so the policy never requires one.
    await this.mfa.isRequired({ userId: user.id, tenantId });

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
      const session = await this.sessions.create(
        { userId: user.id, tenantId, ipAddress: context?.ipAddress ?? null, userAgent: context?.userAgent ?? null },
        tx,
      );
      if (context) context.sessionId = session.sessionId;
      await this.audit.record(
        {
          action: 'LOGIN_SUCCEEDED',
          category: 'AUTH',
          actorUserId: user.id,
          tenantId,
          resourceType: 'session',
          resourceId: session.sessionId,
          metadata: { mustChange: result.passwordChangeRequired, provider: this.identity.id },
        },
        tx,
      );
      return { token: session.token, absoluteExpiresAt: session.absoluteExpiresAt };
    });
  }

  async logout(principal: AuthPrincipal): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.sessions.revoke(principal.sessionId, 'LOGOUT', tx);
      await this.audit.record({ action: 'LOGOUT', category: 'AUTH', resourceType: 'session', resourceId: principal.sessionId }, tx);
    });
  }

  /** Switches the active hospital. The target must be one of the caller's active memberships. */
  async selectTenant(principal: AuthPrincipal, tenantId: string): Promise<string> {
    const membership = (await this.activeMemberships(principal.userId)).find((item) => item.tenantId === tenantId);
    if (!membership) {
      await this.audit.recordSafely({
        action: 'TENANT_SELECTION_DENIED',
        category: 'AUTHZ',
        result: 'DENIED',
        tenantId: null,
        metadata: { requestedTenantId: tenantId },
      });
      throw new AppError('TENANT_ACCESS_DENIED', HttpStatus.FORBIDDEN, 'You do not have access to that hospital.');
    }
    const token = await this.sessions.rotate(principal.sessionId, { tenantId });
    await this.audit.record({
      action: 'TENANT_SELECTED',
      category: 'AUTH',
      tenantId,
      resourceType: 'session',
      resourceId: principal.sessionId,
    });
    return token;
  }

  /** Verifies the current password, revokes all other sessions and rotates the current token. */
  async changePassword(principal: AuthPrincipal, currentPassword: string, newPassword: string): Promise<string> {
    const credentials = this.identity.credentials;
    if (!credentials) {
      throw new AppError('ACCESS_DENIED', HttpStatus.FORBIDDEN, 'Passwords are managed by the identity provider.');
    }
    if (!(await credentials.verifyPassword(principal.userId, currentPassword))) {
      await this.registerFailure(principal.userId, 'INVALID_CURRENT_PASSWORD', 'PASSWORD_CHANGE_FAILED');
      throw new AppError('AUTH_INVALID', HttpStatus.UNAUTHORIZED, 'The current password is incorrect.');
    }
    this.passwordPolicy.assertAcceptable(newPassword, principal.session.user.username);
    if (currentPassword === newPassword) {
      throw new AppError('PASSWORD_POLICY_VIOLATION', HttpStatus.UNPROCESSABLE_ENTITY, 'The new password must differ from the current password.', {
        violations: ['must differ from the current password'],
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await credentials.setPassword(principal.userId, newPassword, { mustChange: false }, tx);
      const revoked = await this.sessions.revokeAllForUser(principal.userId, 'PASSWORD_CHANGED', { exceptSessionId: principal.sessionId }, tx);
      await this.audit.record(
        { action: 'PASSWORD_CHANGED', category: 'AUTH', resourceType: 'user', resourceId: principal.userId, metadata: { revokedSessions: revoked } },
        tx,
      );
    });
    return this.sessions.rotate(principal.sessionId);
  }

  async me(principal: AuthPrincipal): Promise<AuthMe> {
    const [user, memberships, platformRoles, tenantRoles, permissions] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: principal.userId },
        select: { id: true, username: true, displayName: true, email: true },
      }),
      this.activeMemberships(principal.userId),
      this.prisma.platformRoleAssignment.findMany({
        where: { userId: principal.userId, role: { status: 'ACTIVE' } },
        select: { role: { select: { key: true } } },
      }),
      principal.tenantId
        ? this.prisma.roleAssignment.findMany({
            where: {
              tenantId: principal.tenantId,
              userId: principal.userId,
              validFrom: { lte: new Date() },
              OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
              role: { status: 'ACTIVE' },
            },
            select: { role: { select: { key: true } } },
          })
        : Promise.resolve([]),
      this.permissions.effectivePermissions(principal),
    ]);
    const active = memberships.find((membership) => membership.tenantId === principal.tenantId);
    return {
      user,
      activeTenant: active ? active.hospital : null,
      memberships,
      platformRoles: platformRoles.map((item) => item.role.key),
      roles: [...new Set(tenantRoles.map((item) => item.role.key))],
      permissions,
      passwordChangeRequired: principal.session.passwordChangeRequired,
      passwordMinLength: this.config.auth.passwordMinLength,
      tenantSelectionRequired: !principal.tenantId && memberships.length > 0,
      csrfToken: deriveCsrfToken(principal.sessionToken),
      session: {
        id: principal.sessionId,
        idleExpiresAt: principal.session.idleExpiresAt.toISOString(),
        absoluteExpiresAt: principal.session.absoluteExpiresAt.toISOString(),
      },
    };
  }

  async listSessions(principal: AuthPrincipal): Promise<SessionSummary[]> {
    const sessions = await this.sessions.listActive(principal.userId);
    return sessions.map((session) => ({
      id: session.id,
      current: session.id === principal.sessionId,
      tenantId: session.tenantId,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      idleExpiresAt: session.idleExpiresAt.toISOString(),
      absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    }));
  }

  /** Revokes one of the caller's own sessions. Returns true when it was the current session. */
  async revokeOwnSession(principal: AuthPrincipal, sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId: principal.userId, revokedAt: null },
      select: { id: true },
    });
    if (!session) throw AppError.notFound('Session');
    await this.prisma.$transaction(async (tx) => {
      await this.sessions.revoke(session.id, 'USER_REVOKED', tx);
      await this.audit.record({ action: 'SESSION_REVOKED', category: 'AUTH', resourceType: 'session', resourceId: session.id }, tx);
    });
    return session.id === principal.sessionId;
  }

  private activeMemberships(userId: string) {
    return this.prisma.userHospitalMembership
      .findMany({
        where: { userId, status: 'ACTIVE', hospital: { status: 'ACTIVE' } },
        select: { tenantId: true, status: true, hospital: { select: { id: true, code: true, name: true } } },
        orderBy: { hospital: { name: 'asc' } },
      });
  }

  private async loginFailed(userId: string | null, reason: string): Promise<void> {
    await this.audit.recordSafely({
      action: 'LOGIN_FAILED',
      category: 'AUTH',
      result: 'FAILURE',
      reason,
      actorUserId: userId,
      tenantId: null,
      resourceType: userId ? 'user' : undefined,
      resourceId: userId ?? undefined,
    });
  }

  /** Counts a failed credential check and locks the account at the configured threshold. */
  private async registerFailure(userId: string, reason: string, action = 'LOGIN_FAILED'): Promise<void> {
    const { lockoutThreshold, lockoutDurationMs } = this.config.auth;
    const current = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { lockedUntil: true } });
    if (current.lockedUntil && current.lockedUntil > new Date()) {
      await this.audit.recordSafely({ action, category: 'AUTH', result: 'FAILURE', reason: 'ACCOUNT_LOCKED', actorUserId: userId, tenantId: null, resourceType: 'user', resourceId: userId });
      return;
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 }, lockedUntil: null },
      select: { failedLoginCount: true },
    });
    await this.audit.recordSafely({ action, category: 'AUTH', result: 'FAILURE', reason, actorUserId: userId, tenantId: null, resourceType: 'user', resourceId: userId });
    if (updated.failedLoginCount >= lockoutThreshold) {
      const lockedUntil = new Date(Date.now() + lockoutDurationMs);
      await this.prisma.user.update({ where: { id: userId }, data: { lockedUntil, failedLoginCount: 0 } });
      await this.audit.recordSafely({
        action: 'ACCOUNT_LOCKED',
        category: 'AUTH',
        result: 'SUCCESS',
        actorType: 'SYSTEM',
        actorUserId: null,
        tenantId: null,
        resourceType: 'user',
        resourceId: userId,
        metadata: { lockedUntil: lockedUntil.toISOString(), threshold: lockoutThreshold },
      });
    }
  }
}
