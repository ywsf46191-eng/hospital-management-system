import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PERMISSION_KEY_PATTERN, PERMISSIONS, PERMISSIONS_BY_KEY } from './permission-registry';
import { ROLE_TEMPLATES } from './role-templates';

/** Validates the code registry; throws on programming errors (unknown keys, bad names, duplicates). */
export function validateRegistry(): void {
  const seen = new Set<string>();
  for (const permission of PERMISSIONS) {
    if (!PERMISSION_KEY_PATTERN.test(permission.key)) throw new Error(`Invalid permission key: ${permission.key}`);
    if (seen.has(permission.key)) throw new Error(`Duplicate permission key: ${permission.key}`);
    seen.add(permission.key);
  }
  const roleKeys = new Set<string>();
  for (const role of ROLE_TEMPLATES) {
    if (roleKeys.has(role.key)) throw new Error(`Duplicate role template: ${role.key}`);
    roleKeys.add(role.key);
    for (const key of role.permissions) {
      const definition = PERMISSIONS_BY_KEY.get(key);
      if (!definition) throw new Error(`Role ${role.key} references unknown permission ${key}`);
      if (definition.level !== 'ANY' && definition.level !== role.level) {
        throw new Error(`Role ${role.key} (${role.level}) cannot hold ${definition.level} permission ${key}`);
      }
    }
  }
}

/**
 * Synchronizes the code-defined registry and system role templates into PostgreSQL (P3-D6).
 * Idempotent; runs at startup and from `pnpm auth:bootstrap`. Permissions removed from code are
 * deactivated, never deleted, so historical role data stays consistent.
 */
@Injectable()
export class PermissionSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.sync();
    } catch (error) {
      // The API must still start (and report health) while PostgreSQL is unavailable.
      this.logger.error(`Permission registry synchronization failed: ${(error as Error).name}`);
    }
  }

  async sync(): Promise<void> {
    validateRegistry();
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('permission-registry-sync'))`;
        const existing = new Map((await tx.permission.findMany()).map((row) => [row.key, row]));
        await tx.permission.createMany({
          data: PERMISSIONS.filter((permission) => !existing.has(permission.key)).map((permission) => ({
            ...permission,
            isActive: true,
          })),
        });
        for (const permission of PERMISSIONS) {
          const row = existing.get(permission.key);
          if (
            row &&
            (row.module !== permission.module ||
              row.level !== permission.level ||
              row.description !== permission.description ||
              !row.isActive)
          ) {
            await tx.permission.update({
              where: { key: permission.key },
              data: { module: permission.module, level: permission.level, description: permission.description, isActive: true },
            });
          }
        }
        await tx.permission.updateMany({
          where: { key: { notIn: PERMISSIONS.map((permission) => permission.key) } },
          data: { isActive: false },
        });

        for (const template of ROLE_TEMPLATES) {
          const existing = await tx.role.findFirst({ where: { tenantId: null, key: template.key }, select: { id: true } });
          const data = { name: template.name, description: template.description, level: template.level, isSystem: true };
          const role = existing
            ? await tx.role.update({ where: { id: existing.id }, data, select: { id: true } })
            : await tx.role.create({ data: { ...data, key: template.key, tenantId: null }, select: { id: true } });
          const scope = template.level === 'PLATFORM' ? 'GLOBAL' : 'HOSPITAL';
          await tx.rolePermission.deleteMany({ where: { roleId: role.id, permissionKey: { notIn: [...template.permissions] } } });
          await tx.rolePermission.createMany({
            data: template.permissions.map((permissionKey) => ({ roleId: role.id, permissionKey, scope })),
            skipDuplicates: true,
          });
        }
      },
      { timeout: 60_000 },
    );
    this.logger.log(`Permission registry synchronized (${PERMISSIONS.length} permissions, ${ROLE_TEMPLATES.length} role templates)`);
  }
}
