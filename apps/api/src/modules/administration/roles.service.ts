import { HttpStatus, Injectable } from '@nestjs/common';
import type { PermissionScope, PermissionSummary, RoleSummary } from '@hospital/types';
import { AppError } from '../../common/errors';
import { PERMISSIONS, PERMISSIONS_BY_KEY } from '../access-control/permission-registry';
import { isModuleEnabled } from '../access-control/permission.service';
import type { AuthPrincipal } from '../access-control/principal';
import { ROLE_TEMPLATE_KEYS } from '../access-control/role-templates';
import { AuditService } from '../audit/audit.service';
import { requireTenantId, TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { UserManagementPolicy } from './user-management.policy';

/** Scopes a hospital role may use. GLOBAL is platform-only; ward/patient scopes need later modules. */
export const TENANT_ROLE_SCOPES = ['HOSPITAL', 'DEPARTMENT', 'OWN_RECORD'] as const;

const roleInclude = { permissions: { select: { permissionKey: true, scope: true }, orderBy: { permissionKey: 'asc' } } } as const;

type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  level: RoleSummary['level'];
  isSystem: boolean;
  status: RoleSummary['status'];
  permissions: { permissionKey: string; scope: PermissionScope }[];
};

function toSummary(role: RoleRow): RoleSummary {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    level: role.level,
    isSystem: role.isSystem,
    status: role.status,
    permissions: role.permissions.map((item) => ({ key: item.permissionKey, scope: item.scope })),
  };
}

/** Data-driven roles (P3-D6). System templates are read-only; hospitals define custom roles. */
@Injectable()
export class RolesService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly policy: UserManagementPolicy,
    private readonly audit: AuditService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  listPermissions(): PermissionSummary[] {
    return PERMISSIONS.filter((permission) => permission.level !== 'PLATFORM').map((permission) => ({
      key: permission.key,
      module: permission.module,
      level: permission.level,
      description: permission.description,
      moduleEnabled: isModuleEnabled(permission.module),
    }));
  }

  async list(): Promise<RoleSummary[]> {
    const roles = await this.db.role.findMany({
      where: { level: 'TENANT' },
      include: roleInclude,
      orderBy: [{ isSystem: 'desc' }, { key: 'asc' }],
    });
    return roles.map(toSummary);
  }

  async get(roleId: string): Promise<RoleSummary> {
    return toSummary(await this.find(roleId));
  }

  async create(input: { key: string; name: string; description?: string }): Promise<RoleSummary> {
    if (ROLE_TEMPLATE_KEYS.has(input.key)) {
      throw AppError.conflict('The key is reserved for a system role template.');
    }
    const role = await this.db.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          tenantId: requireTenantId(),
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          level: 'TENANT',
          isSystem: false,
        },
        include: roleInclude,
      });
      await this.audit.record(
        { action: 'ROLE_CREATED', category: 'ROLE', resourceType: 'role', resourceId: created.id, after: input },
        tx,
      );
      return created;
    });
    return toSummary(role);
  }

  async update(
    roleId: string,
    input: { name?: string; description?: string | null; status?: 'ACTIVE' | 'DISABLED' },
  ): Promise<RoleSummary> {
    const role = await this.findCustom(roleId);
    const updated = await this.db.$transaction(async (tx) => {
      const result = await tx.role.update({ where: { id: role.id }, data: input, include: roleInclude });
      await this.audit.record(
        {
          action: 'ROLE_UPDATED',
          category: 'ROLE',
          resourceType: 'role',
          resourceId: role.id,
          before: { name: role.name, description: role.description, status: role.status },
          after: input,
        },
        tx,
      );
      return result;
    });
    return toSummary(updated);
  }

  async grantPermission(
    principal: AuthPrincipal,
    roleId: string,
    input: { permission: string; scope: (typeof TENANT_ROLE_SCOPES)[number] },
  ): Promise<RoleSummary> {
    const role = await this.findCustom(roleId);
    const definition = PERMISSIONS_BY_KEY.get(input.permission);
    if (!definition || definition.level === 'PLATFORM') {
      throw new AppError('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, 'Unknown or platform-only permission.');
    }
    await this.policy.assertHolds(principal, [input.permission], { roleId: role.id });
    await this.db.$transaction(async (tx) => {
      await tx.rolePermission.upsert({
        where: { roleId_permissionKey: { roleId: role.id, permissionKey: input.permission } },
        create: { roleId: role.id, permissionKey: input.permission, scope: input.scope },
        update: { scope: input.scope },
      });
      await this.audit.record(
        { action: 'ROLE_PERMISSION_GRANTED', category: 'ROLE', resourceType: 'role', resourceId: role.id, after: input },
        tx,
      );
    });
    return this.get(role.id);
  }

  async revokePermission(principal: AuthPrincipal, roleId: string, permission: string): Promise<RoleSummary> {
    const role = await this.findCustom(roleId);
    const existing = role.permissions.find((item) => item.permissionKey === permission);
    if (!existing) throw AppError.notFound('Role permission');
    await this.policy.assertHolds(principal, [permission], { roleId: role.id });
    await this.db.$transaction(async (tx) => {
      await tx.rolePermission.delete({ where: { roleId_permissionKey: { roleId: role.id, permissionKey: permission } } });
      await this.audit.record(
        {
          action: 'ROLE_PERMISSION_REVOKED',
          category: 'ROLE',
          resourceType: 'role',
          resourceId: role.id,
          before: { permission, scope: existing.scope },
        },
        tx,
      );
    });
    return this.get(role.id);
  }

  private async find(roleId: string): Promise<RoleRow> {
    const role = await this.db.role.findFirst({ where: { id: roleId, level: 'TENANT' }, include: roleInclude });
    if (!role) throw AppError.notFound('Role');
    return role;
  }

  private async findCustom(roleId: string): Promise<RoleRow> {
    const role = await this.find(roleId);
    if (role.isSystem) throw AppError.forbidden('System role templates are read-only.');
    return role;
  }
}
