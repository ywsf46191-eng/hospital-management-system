import { Injectable } from '@nestjs/common';
import type { MembershipStatus, Paginated, RoleAssignmentSummary, TenantUser } from '@hospital/types';
import { AppError } from '../../common/errors';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthPrincipal } from '../access-control/principal';
import { AuditService } from '../audit/audit.service';
import { IdentityProvider } from '../identity/identity-provider';
import { PasswordPolicy } from '../identity/password-policy';
import { SessionService } from '../identity/session.service';
import { requireTenantId, TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { UserManagementPolicy } from './user-management.policy';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  status: true,
  lastLoginAt: true,
} as const;

/** Users of the active hospital. All tenant data is read through the tenant-scoped client. */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly identity: IdentityProvider,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly sessions: SessionService,
    private readonly policy: UserManagementPolicy,
    private readonly audit: AuditService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async list(query: { page: number; pageSize: number; search?: string }): Promise<Paginated<TenantUser>> {
    const where = query.search
      ? {
          user: {
            OR: [
              { username: { contains: query.search, mode: 'insensitive' as const } },
              { displayName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};
    const [memberships, total] = await Promise.all([
      this.db.userHospitalMembership.findMany({
        where,
        include: { user: { select: userSelect } },
        orderBy: { user: { username: 'asc' } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.db.userHospitalMembership.count({ where }),
    ]);
    const items = await this.withAccess(memberships);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async get(userId: string): Promise<TenantUser> {
    const membership = await this.membershipOf(userId);
    const [user] = await this.withAccess([membership]);
    return user as TenantUser;
  }

  async create(
    input: { username: string; displayName: string; email?: string; temporaryPassword: string },
  ): Promise<TenantUser> {
    const credentials = this.requireCredentials();
    this.passwordPolicy.assertAcceptable(input.temporaryPassword, input.username);
    if (await this.prisma.user.findUnique({ where: { username: input.username }, select: { id: true } })) {
      throw AppError.conflict('The username is not available.');
    }
    const userId = await this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: input.username, displayName: input.displayName, email: input.email ?? null, status: 'ACTIVE' },
        select: { id: true },
      });
      await credentials.setPassword(user.id, input.temporaryPassword, { mustChange: true }, tx);
      await tx.userHospitalMembership.create({ data: { tenantId: requireTenantId(), userId: user.id, status: 'ACTIVE' } });
      await this.audit.record(
        {
          action: 'USER_CREATED',
          category: 'USER',
          resourceType: 'user',
          resourceId: user.id,
          after: { username: input.username, displayName: input.displayName, email: input.email ?? null },
        },
        tx,
      );
      return user.id;
    });
    return this.get(userId);
  }

  async updateProfile(
    principal: AuthPrincipal,
    userId: string,
    input: { displayName?: string; email?: string | null },
  ): Promise<TenantUser> {
    const tenantId = requireTenantId();
    const membership = await this.membershipOf(userId);
    this.policy.assertNotSelf(principal, userId);
    await this.policy.assertExclusiveToTenant(userId, tenantId);
    await this.policy.assertCanManage(principal, userId);
    await this.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: input });
      await this.audit.record(
        {
          action: 'USER_UPDATED',
          category: 'USER',
          resourceType: 'user',
          resourceId: userId,
          before: { displayName: membership.user.displayName, email: membership.user.email },
          after: input,
        },
        tx,
      );
    });
    return this.get(userId);
  }

  /** Changes the user's access to this hospital only; the global account is untouched. */
  async setMembershipStatus(principal: AuthPrincipal, userId: string, status: MembershipStatus): Promise<TenantUser> {
    const tenantId = requireTenantId();
    const membership = await this.membershipOf(userId);
    this.policy.assertNotSelf(principal, userId);
    await this.policy.assertCanManage(principal, userId);
    if (membership.status !== status) {
      await this.db.$transaction(async (tx) => {
        await tx.userHospitalMembership.update({ where: { id: membership.id }, data: { status } });
        const revoked =
          status === 'ACTIVE' ? 0 : await this.sessions.revokeAllForUser(userId, 'MEMBERSHIP_INACTIVE', { tenantId }, tx);
        await this.audit.record(
          {
            action: 'MEMBERSHIP_STATUS_CHANGED',
            category: 'MEMBERSHIP',
            resourceType: 'user',
            resourceId: userId,
            before: { status: membership.status },
            after: { status },
            metadata: { revokedSessions: revoked },
          },
          tx,
        );
      });
    }
    return this.get(userId);
  }

  /** Admin-initiated reset (P3-D8): temporary password, forced change, all sessions revoked. */
  async resetPassword(principal: AuthPrincipal, userId: string, temporaryPassword: string): Promise<void> {
    const tenantId = requireTenantId();
    const credentials = this.requireCredentials();
    const membership = await this.membershipOf(userId);
    this.policy.assertNotSelf(principal, userId);
    await this.policy.assertExclusiveToTenant(userId, tenantId);
    await this.policy.assertCanManage(principal, userId);
    this.passwordPolicy.assertAcceptable(temporaryPassword, membership.user.username);
    await this.db.$transaction(async (tx) => {
      await credentials.setPassword(userId, temporaryPassword, { mustChange: true }, tx);
      await tx.user.update({ where: { id: userId }, data: { failedLoginCount: 0, lockedUntil: null } });
      const revoked = await this.sessions.revokeAllForUser(userId, 'PASSWORD_RESET', {}, tx);
      await this.audit.record(
        {
          action: 'PASSWORD_RESET_BY_ADMIN',
          category: 'USER',
          resourceType: 'user',
          resourceId: userId,
          metadata: { revokedSessions: revoked, mustChange: true },
        },
        tx,
      );
    });
  }

  async listRoles(userId: string): Promise<RoleAssignmentSummary[]> {
    await this.membershipOf(userId);
    const assignments = await this.db.roleAssignment.findMany({
      where: { userId },
      include: { role: { select: { id: true, key: true, name: true, isSystem: true } } },
      orderBy: { validFrom: 'asc' },
    });
    return assignments.map(toAssignmentSummary);
  }

  async assignRole(
    principal: AuthPrincipal,
    userId: string,
    input: { roleId: string; departmentId?: string; validUntil?: Date },
  ): Promise<RoleAssignmentSummary> {
    await this.membershipOf(userId);
    this.policy.assertNotSelf(principal, userId);
    const role = await this.db.role.findFirst({
      where: { id: input.roleId, status: 'ACTIVE', level: 'TENANT' },
      include: { permissions: { select: { permissionKey: true } } },
    });
    if (!role) throw AppError.notFound('Role');
    await this.policy.assertHolds(
      principal,
      role.permissions.map((item) => item.permissionKey),
      { targetUserId: userId, roleId: role.id },
    );
    if (input.departmentId) {
      const department = await this.db.department.findFirst({ where: { id: input.departmentId, status: 'ACTIVE' } });
      if (!department) throw AppError.notFound('Department');
    }
    if (input.validUntil && input.validUntil <= new Date()) {
      throw AppError.conflict('validUntil must be in the future.');
    }
    const duplicate = await this.db.roleAssignment.findFirst({
      where: {
        userId,
        roleId: role.id,
        departmentId: input.departmentId ?? null,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    if (duplicate) throw AppError.conflict('The user already has this role.');

    const assignment = await this.db.$transaction(async (tx) => {
      const created = await tx.roleAssignment.create({
        data: {
          tenantId: requireTenantId(),
          userId,
          roleId: role.id,
          departmentId: input.departmentId ?? null,
          validUntil: input.validUntil ?? null,
          assignedById: principal.userId,
        },
        include: { role: { select: { id: true, key: true, name: true, isSystem: true } } },
      });
      await this.audit.record(
        {
          action: 'ROLE_ASSIGNED',
          category: 'ROLE',
          resourceType: 'user',
          resourceId: userId,
          after: { assignmentId: created.id, role: role.key, departmentId: created.departmentId, validUntil: created.validUntil },
        },
        tx,
      );
      return created;
    });
    return toAssignmentSummary(assignment);
  }

  async removeRole(principal: AuthPrincipal, userId: string, assignmentId: string): Promise<void> {
    this.policy.assertNotSelf(principal, userId);
    const assignment = await this.db.roleAssignment.findFirst({
      where: { id: assignmentId, userId },
      include: { role: { select: { key: true, permissions: { select: { permissionKey: true } } } } },
    });
    if (!assignment) throw AppError.notFound('Role assignment');
    await this.policy.assertHolds(
      principal,
      assignment.role.permissions.map((item) => item.permissionKey),
      { targetUserId: userId, assignmentId },
    );
    await this.db.$transaction(async (tx) => {
      await tx.roleAssignment.delete({ where: { id: assignment.id } });
      await this.audit.record(
        {
          action: 'ROLE_UNASSIGNED',
          category: 'ROLE',
          resourceType: 'user',
          resourceId: userId,
          before: { assignmentId, role: assignment.role.key, departmentId: assignment.departmentId },
        },
        tx,
      );
    });
  }

  async addDepartment(principal: AuthPrincipal, userId: string, departmentId: string): Promise<TenantUser> {
    await this.membershipOf(userId);
    await this.policy.assertCanManage(principal, userId);
    const department = await this.db.department.findFirst({ where: { id: departmentId, status: 'ACTIVE' } });
    if (!department) throw AppError.notFound('Department');
    await this.db.$transaction(async (tx) => {
      await tx.userDepartment.create({ data: { tenantId: requireTenantId(), userId, departmentId } });
      await this.audit.record(
        { action: 'USER_DEPARTMENT_ADDED', category: 'USER', resourceType: 'user', resourceId: userId, after: { departmentId } },
        tx,
      );
    });
    return this.get(userId);
  }

  async removeDepartment(principal: AuthPrincipal, userId: string, departmentId: string): Promise<TenantUser> {
    await this.membershipOf(userId);
    await this.policy.assertCanManage(principal, userId);
    const link = await this.db.userDepartment.findFirst({ where: { userId, departmentId } });
    if (!link) throw AppError.notFound('Department membership');
    await this.db.$transaction(async (tx) => {
      await tx.userDepartment.delete({ where: { id: link.id } });
      await this.audit.record(
        { action: 'USER_DEPARTMENT_REMOVED', category: 'USER', resourceType: 'user', resourceId: userId, before: { departmentId } },
        tx,
      );
    });
    return this.get(userId);
  }

  private requireCredentials() {
    const credentials = this.identity.credentials;
    if (!credentials) throw AppError.forbidden('Passwords are managed by the identity provider.');
    return credentials;
  }

  /** 404 for users outside the active hospital — never reveals that they exist elsewhere. */
  private async membershipOf(userId: string) {
    const membership = await this.db.userHospitalMembership.findFirst({
      where: { userId },
      include: { user: { select: userSelect } },
    });
    if (!membership) throw AppError.notFound('User');
    return membership;
  }

  private async withAccess(
    memberships: { id: string; userId: string; status: MembershipStatus; user: { id: string; username: string; displayName: string; email: string | null; status: TenantUser['userStatus']; lastLoginAt: Date | null } }[],
  ): Promise<TenantUser[]> {
    const userIds = memberships.map((membership) => membership.userId);
    const [assignments, departments] = await Promise.all([
      this.db.roleAssignment.findMany({
        where: { userId: { in: userIds } },
        include: { role: { select: { id: true, key: true, name: true, isSystem: true } } },
      }),
      this.db.userDepartment.findMany({
        where: { userId: { in: userIds } },
        include: { department: { select: { id: true, code: true, name: true } } },
      }),
    ]);
    return memberships.map(({ user, status }) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      userStatus: user.status,
      membershipStatus: status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      roles: assignments.filter((item) => item.userId === user.id).map(toAssignmentSummary),
      departments: departments.filter((item) => item.userId === user.id).map((item) => item.department),
    }));
  }
}

function toAssignmentSummary(assignment: {
  id: string;
  departmentId: string | null;
  validFrom: Date;
  validUntil: Date | null;
  role: { id: string; key: string; name: string; isSystem: boolean };
}): RoleAssignmentSummary {
  return {
    id: assignment.id,
    role: assignment.role,
    departmentId: assignment.departmentId,
    validFrom: assignment.validFrom.toISOString(),
    validUntil: assignment.validUntil?.toISOString() ?? null,
  };
}
