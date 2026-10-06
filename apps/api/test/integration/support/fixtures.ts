import { randomBytes } from 'node:crypto';
import type { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { PasswordHasher } from '../../../src/modules/identity/password-hasher';

const hasher = new PasswordHasher();

export function uniqueName(prefix: string): string {
  return `${prefix}${randomBytes(4).toString('hex')}`;
}

/** Synthetic test password, generated per run (never a fixed credential). */
export function testPassword(): string {
  return `Pw-${randomBytes(12).toString('base64url')}`;
}

export class Fixtures {
  constructor(private readonly prisma: PrismaService) {}

  async hospital(prefix = 'H') {
    return this.prisma.hospital.create({
      data: { code: uniqueName(prefix).toUpperCase(), name: `Test hospital ${prefix}`, type: 'PRIVATE' },
    });
  }

  async user(options: { password?: string; mustChange?: boolean; status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED' } = {}) {
    const password = options.password ?? testPassword();
    const user = await this.prisma.user.create({
      data: { username: uniqueName('user'), displayName: 'Test User', status: options.status ?? 'ACTIVE' },
    });
    await this.prisma.userCredential.create({
      data: { userId: user.id, passwordHash: await hasher.hash(password), mustChange: options.mustChange ?? false },
    });
    return { ...user, password };
  }

  async membership(userId: string, tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' = 'ACTIVE') {
    return this.prisma.userHospitalMembership.create({ data: { userId, tenantId, status } });
  }

  async assignTemplate(userId: string, tenantId: string, templateKey: string, departmentId?: string) {
    const role = await this.prisma.role.findFirstOrThrow({ where: { key: templateKey, tenantId: null } });
    return this.prisma.roleAssignment.create({ data: { userId, tenantId, roleId: role.id, departmentId: departmentId ?? null } });
  }

  async customRole(tenantId: string, permissions: string[]) {
    const role = await this.prisma.role.create({
      data: { tenantId, key: uniqueName('CUSTOM_').toUpperCase(), name: 'Custom', level: 'TENANT', isSystem: false },
    });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((permissionKey) => ({ roleId: role.id, permissionKey, scope: 'HOSPITAL' as const })),
    });
    return role;
  }

  /** A hospital member holding the given role template in that hospital. */
  async member(tenantId: string, templateKey: string | null, options: { mustChange?: boolean } = {}) {
    const user = await this.user(options);
    await this.membership(user.id, tenantId);
    if (templateKey) await this.assignTemplate(user.id, tenantId, templateKey);
    return user;
  }

  async platformAdmin() {
    const user = await this.user();
    const role = await this.prisma.role.findFirstOrThrow({ where: { key: 'SUPER_ADMIN', tenantId: null } });
    await this.prisma.platformRoleAssignment.create({ data: { userId: user.id, roleId: role.id } });
    return user;
  }
}
