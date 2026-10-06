import { Injectable } from '@nestjs/common';
import type { Paginated, PlatformHospital, UserStatus } from '@hospital/types';
import { AppError } from '../../common/errors';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthPrincipal } from '../access-control/principal';
import { AuditService } from '../audit/audit.service';
import { IdentityProvider } from '../identity/identity-provider';
import { PasswordPolicy } from '../identity/password-policy';
import { SessionService } from '../identity/session.service';
import { UserManagementPolicy } from './user-management.policy';

const hospitalSelect = { id: true, code: true, name: true, type: true, status: true, createdAt: true } as const;

export interface PlatformUser {
  id: string;
  username: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt: string | null;
  platformRoles: string[];
  memberships: { tenantId: string; hospitalCode: string; status: string }[];
}

function toHospital(row: { id: string; code: string; name: string; type: PlatformHospital['type']; status: PlatformHospital['status']; createdAt: Date }): PlatformHospital {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

/**
 * Platform (cross-tenant) administration. Runs without an active tenant: every query names the
 * target tenant explicitly and audit entries are attributed to that tenant.
 */
@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityProvider,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly sessions: SessionService,
    private readonly policy: UserManagementPolicy,
    private readonly audit: AuditService,
  ) {}

  async listHospitals(): Promise<PlatformHospital[]> {
    const rows = await this.prisma.hospital.findMany({ select: hospitalSelect, orderBy: { code: 'asc' } });
    return rows.map(toHospital);
  }

  async createHospital(input: { code: string; name: string; type: PlatformHospital['type'] }): Promise<PlatformHospital> {
    const hospital = await this.prisma.$transaction(async (tx) => {
      const created = await tx.hospital.create({ data: input, select: hospitalSelect });
      await this.audit.record(
        { action: 'TENANT_CREATED', category: 'TENANT', tenantId: created.id, resourceType: 'hospital', resourceId: created.id, after: input },
        tx,
      );
      return created;
    });
    return toHospital(hospital);
  }

  async setHospitalStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<PlatformHospital> {
    const existing = await this.prisma.hospital.findUnique({ where: { id }, select: hospitalSelect });
    if (!existing) throw AppError.notFound('Hospital');
    const hospital = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hospital.update({ where: { id }, data: { status }, select: hospitalSelect });
      const revoked =
        status === 'ACTIVE'
          ? { count: 0 }
          : await tx.session.updateMany({
              where: { tenantId: id, revokedAt: null },
              data: { revokedAt: new Date(), revokeReason: 'MEMBERSHIP_INACTIVE' },
            });
      await this.audit.record(
        {
          action: 'TENANT_STATUS_CHANGED',
          category: 'TENANT',
          tenantId: id,
          resourceType: 'hospital',
          resourceId: id,
          before: { status: existing.status },
          after: { status },
          metadata: { revokedSessions: revoked.count },
        },
        tx,
      );
      return updated;
    });
    return toHospital(hospital);
  }

  /** Creates a new account that administers one hospital via the HOSPITAL_ADMIN template. */
  async createHospitalAdministrator(
    principal: AuthPrincipal,
    tenantId: string,
    input: { username: string; displayName: string; email?: string; temporaryPassword: string },
  ): Promise<{ userId: string }> {
    const credentials = this.requireCredentials();
    const hospital = await this.prisma.hospital.findUnique({ where: { id: tenantId }, select: { id: true, status: true } });
    if (!hospital) throw AppError.notFound('Hospital');
    this.passwordPolicy.assertAcceptable(input.temporaryPassword, input.username);
    if (await this.prisma.user.findUnique({ where: { username: input.username }, select: { id: true } })) {
      throw AppError.conflict('The username is not available.');
    }
    const template = await this.prisma.role.findFirst({ where: { key: 'HOSPITAL_ADMIN', tenantId: null }, select: { id: true } });
    if (!template) throw new Error('HOSPITAL_ADMIN template is missing; permission sync has not run.');

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: input.username, displayName: input.displayName, email: input.email ?? null, status: 'ACTIVE' },
        select: { id: true },
      });
      await credentials.setPassword(user.id, input.temporaryPassword, { mustChange: true }, tx);
      await tx.userHospitalMembership.create({ data: { tenantId, userId: user.id, status: 'ACTIVE' } });
      await tx.roleAssignment.create({
        data: { tenantId, userId: user.id, roleId: template.id, assignedById: principal.userId },
      });
      await this.audit.record(
        {
          action: 'TENANT_ADMIN_CREATED',
          category: 'TENANT',
          tenantId,
          resourceType: 'user',
          resourceId: user.id,
          after: { username: input.username, displayName: input.displayName, role: 'HOSPITAL_ADMIN' },
        },
        tx,
      );
      return { userId: user.id };
    });
  }

  /** Grants an existing account access to another hospital (no roles; the hospital assigns them). */
  async addMembership(userId: string, tenantId: string): Promise<void> {
    const [user, hospital] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.prisma.hospital.findUnique({ where: { id: tenantId }, select: { id: true } }),
    ]);
    if (!user) throw AppError.notFound('User');
    if (!hospital) throw AppError.notFound('Hospital');
    await this.prisma.$transaction(async (tx) => {
      await tx.userHospitalMembership.create({ data: { tenantId, userId, status: 'ACTIVE' } });
      await this.audit.record(
        { action: 'MEMBERSHIP_CREATED', category: 'MEMBERSHIP', tenantId, resourceType: 'user', resourceId: userId },
        tx,
      );
    });
  }

  async listUsers(query: { page: number; pageSize: number; search?: string }): Promise<Paginated<PlatformUser>> {
    const where = query.search
      ? {
          OR: [
            { username: { contains: query.search, mode: 'insensitive' as const } },
            { displayName: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          status: true,
          lastLoginAt: true,
          platformRoleAssignments: { select: { role: { select: { key: true } } } },
          memberships: { select: { tenantId: true, status: true, hospital: { select: { code: true } } } },
        },
        orderBy: { username: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        status: row.status,
        lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
        platformRoles: row.platformRoleAssignments.map((item) => item.role.key),
        memberships: row.memberships.map((item) => ({ tenantId: item.tenantId, hospitalCode: item.hospital.code, status: item.status })),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async resetPassword(principal: AuthPrincipal, userId: string, temporaryPassword: string): Promise<void> {
    const credentials = this.requireCredentials();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
    if (!user) throw AppError.notFound('User');
    this.policy.assertNotSelf(principal, userId);
    await this.policy.assertCanManage(principal, userId, true);
    this.passwordPolicy.assertAcceptable(temporaryPassword, user.username);
    await this.prisma.$transaction(async (tx) => {
      await credentials.setPassword(userId, temporaryPassword, { mustChange: true }, tx);
      await tx.user.update({ where: { id: userId }, data: { failedLoginCount: 0, lockedUntil: null } });
      const revoked = await this.sessions.revokeAllForUser(userId, 'PASSWORD_RESET', {}, tx);
      await this.audit.record(
        {
          action: 'PASSWORD_RESET_BY_ADMIN',
          category: 'USER',
          tenantId: null,
          resourceType: 'user',
          resourceId: userId,
          metadata: { revokedSessions: revoked, mustChange: true, platform: true },
        },
        tx,
      );
    });
  }

  /** Global account status: a non-active account cannot sign in to any hospital. */
  async setUserStatus(principal: AuthPrincipal, userId: string, status: UserStatus): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!user) throw AppError.notFound('User');
    this.policy.assertNotSelf(principal, userId);
    await this.policy.assertCanManage(principal, userId, true);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status } });
      const revoked = status === 'ACTIVE' ? 0 : await this.sessions.revokeAllForUser(userId, 'USER_INACTIVE', {}, tx);
      await this.audit.record(
        {
          action: 'USER_STATUS_CHANGED',
          category: 'USER',
          tenantId: null,
          resourceType: 'user',
          resourceId: userId,
          before: { status: user.status },
          after: { status },
          metadata: { revokedSessions: revoked },
        },
        tx,
      );
    });
  }

  private requireCredentials() {
    const credentials = this.identity.credentials;
    if (!credentials) throw AppError.forbidden('Passwords are managed by the identity provider.');
    return credentials;
  }
}
