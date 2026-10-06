import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CORE_MODULES, PERMISSIONS_BY_KEY } from './permission-registry';
import type { AuthPrincipal, PermissionGrant } from './principal';

export type DenyReason =
  | 'UNKNOWN_PERMISSION'
  | 'MODULE_NOT_ENABLED'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'NO_PERMISSION'
  | 'TENANT_MISMATCH'
  | 'SCOPE_DENIED';

export type Decision = { allowed: true } | { allowed: false; reason: DenyReason };

/** Optional resource attributes for scope evaluation (RBAC.md §39–§40). */
export interface ResourceContext {
  tenantId?: string;
  departmentId?: string | null;
  ownerUserId?: string | null;
}

export function isModuleEnabled(module: string): boolean {
  return CORE_MODULES.has(module);
}

/**
 * Central authorization decision (RBAC.md §49): permission exists → module enabled → tenant
 * context → granted by an active role → resource tenant → scope. Default deny.
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Grants from active platform roles plus active, unexpired roles in the session's tenant. */
  async loadGrants(userId: string, tenantId: string | null): Promise<PermissionGrant[]> {
    const now = new Date();
    const rolePermissions = {
      where: { permission: { isActive: true } },
      select: { permissionKey: true, scope: true },
    } as const;

    const platform = await this.prisma.platformRoleAssignment.findMany({
      where: { userId, role: { status: 'ACTIVE', level: 'PLATFORM' }, user: { status: 'ACTIVE' } },
      select: { role: { select: { permissions: rolePermissions } } },
    });
    const grants: PermissionGrant[] = platform.flatMap(({ role }) =>
      role.permissions
        .filter(({ permissionKey }) => PERMISSIONS_BY_KEY.get(permissionKey)?.level !== 'TENANT')
        .map(({ permissionKey, scope }) => ({ permission: permissionKey, scope, tenantId: null, departmentId: null })),
    );

    if (tenantId) {
      const assignments = await this.prisma.roleAssignment.findMany({
        where: {
          tenantId,
          userId,
          validFrom: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gt: now } }],
          membership: { status: 'ACTIVE', hospital: { status: 'ACTIVE' } },
          role: { status: 'ACTIVE', level: 'TENANT', OR: [{ tenantId: null }, { tenantId }] },
        },
        select: { departmentId: true, role: { select: { permissions: rolePermissions } } },
      });
      for (const assignment of assignments) {
        for (const { permissionKey, scope } of assignment.role.permissions) {
          if (PERMISSIONS_BY_KEY.get(permissionKey)?.level === 'PLATFORM') continue;
          grants.push({ permission: permissionKey, scope, tenantId, departmentId: assignment.departmentId });
        }
      }
    }
    return grants;
  }

  async ensureGrants(principal: AuthPrincipal): Promise<PermissionGrant[]> {
    principal.grants ??= await this.loadGrants(principal.userId, principal.tenantId);
    return principal.grants;
  }

  async can(principal: AuthPrincipal, permission: string, resource?: ResourceContext): Promise<Decision> {
    const definition = PERMISSIONS_BY_KEY.get(permission);
    if (!definition) return { allowed: false, reason: 'UNKNOWN_PERMISSION' };
    if (!isModuleEnabled(definition.module)) return { allowed: false, reason: 'MODULE_NOT_ENABLED' };
    if (definition.level === 'TENANT' && !principal.tenantId) {
      return { allowed: false, reason: 'TENANT_CONTEXT_REQUIRED' };
    }

    const grants = (await this.ensureGrants(principal)).filter((grant) => grant.permission === permission);
    if (grants.length === 0) return { allowed: false, reason: 'NO_PERMISSION' };
    if (!resource) {
      // Without a resource the action is hospital-wide, so narrower scopes do not qualify.
      return grants.some((grant) => grant.scope === 'HOSPITAL' || (grant.scope === 'GLOBAL' && grant.tenantId === null))
        ? { allowed: true }
        : { allowed: false, reason: 'SCOPE_DENIED' };
    }

    if (resource.tenantId !== undefined && definition.level !== 'PLATFORM' && resource.tenantId !== principal.tenantId) {
      return { allowed: false, reason: 'TENANT_MISMATCH' };
    }
    for (const grant of grants) {
      if (await this.scopeAllows(principal, grant, resource)) return { allowed: true };
    }
    return { allowed: false, reason: 'SCOPE_DENIED' };
  }

  /** Effective permission keys usable in the current context (for UI navigation only). */
  async effectivePermissions(principal: AuthPrincipal): Promise<string[]> {
    const grants = await this.ensureGrants(principal);
    return [...new Set(grants.map((grant) => grant.permission))]
      .filter((key) => {
        const definition = PERMISSIONS_BY_KEY.get(key);
        return definition !== undefined && isModuleEnabled(definition.module);
      })
      .sort();
  }

  /** Escalation guard (RBAC.md §52): an actor may only grant permissions they hold themselves. */
  async holdsAll(principal: AuthPrincipal, permissions: Iterable<string>): Promise<string[]> {
    const held = new Set((await this.ensureGrants(principal)).map((grant) => grant.permission));
    return [...permissions].filter((permission) => !held.has(permission));
  }

  private async scopeAllows(principal: AuthPrincipal, grant: PermissionGrant, resource: ResourceContext) {
    switch (grant.scope) {
      case 'GLOBAL':
        return grant.tenantId === null;
      case 'HOSPITAL':
        return true;
      case 'OWN_RECORD':
        return !!resource.ownerUserId && resource.ownerUserId === principal.userId;
      case 'DEPARTMENT': {
        if (!resource.departmentId) return false;
        if (grant.departmentId) return grant.departmentId === resource.departmentId;
        if (!principal.tenantId) return false;
        const membership = await this.prisma.userDepartment.findFirst({
          where: { tenantId: principal.tenantId, userId: principal.userId, departmentId: resource.departmentId },
          select: { id: true },
        });
        return membership !== null;
      }
      // Ward and patient-assignment policies require the clinical modules (later phases): deny.
      case 'WARD':
      case 'ASSIGNED_PATIENT':
        return false;
    }
  }
}
