import { Injectable } from '@nestjs/common';
import { AppError } from '../../common/errors';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PERMISSIONS_BY_KEY } from '../access-control/permission-registry';
import { PermissionService } from '../access-control/permission.service';
import type { AuthPrincipal } from '../access-control/principal';
import { AuditService } from '../audit/audit.service';

/**
 * Rules for acting on another user's account (RBAC.md §52):
 * - administrators cannot use admin endpoints on themselves (use /auth endpoints instead);
 * - an actor cannot manage a user who holds permissions the actor does not hold;
 * - global account data (password, profile) is changed by a tenant only when the user belongs
 *   exclusively to that tenant and holds no platform role.
 */
@Injectable()
export class UserManagementPolicy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
    private readonly audit: AuditService,
  ) {}

  assertNotSelf(principal: AuthPrincipal, userId: string): void {
    if (principal.userId === userId) {
      throw AppError.forbidden('Use your own account settings to manage your account.');
    }
  }

  /** Blocks privilege escalation: target's permissions in this context must be a subset of the actor's. */
  async assertCanManage(principal: AuthPrincipal, userId: string, platform = false): Promise<void> {
    const grants = await this.permissions.loadGrants(userId, platform ? null : principal.tenantId);
    const targetPermissions = grants
      .map((grant) => grant.permission)
      .filter((key) => platform || PERMISSIONS_BY_KEY.get(key)?.level !== 'PLATFORM');
    await this.assertHolds(principal, targetPermissions, { targetUserId: userId });
  }

  async assertHolds(principal: AuthPrincipal, permissions: Iterable<string>, metadata: Record<string, unknown> = {}) {
    const missing = await this.permissions.holdsAll(principal, new Set(permissions));
    if (missing.length > 0) {
      await this.audit.recordSafely({
        action: 'PRIVILEGE_ESCALATION_DENIED',
        category: 'AUTHZ',
        result: 'DENIED',
        reason: 'MISSING_PERMISSIONS',
        metadata: { ...metadata, missing },
      });
      throw AppError.forbidden('You cannot grant or manage permissions you do not hold.');
    }
  }

  async assertExclusiveToTenant(userId: string, tenantId: string): Promise<void> {
    const [otherMemberships, platformRoles] = await Promise.all([
      this.prisma.userHospitalMembership.count({ where: { userId, tenantId: { not: tenantId } } }),
      this.prisma.platformRoleAssignment.count({ where: { userId } }),
    ]);
    if (otherMemberships > 0 || platformRoles > 0) {
      throw AppError.forbidden('This account is shared with other hospitals or the platform; ask a platform administrator.');
    }
  }
}
