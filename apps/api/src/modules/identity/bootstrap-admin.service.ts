import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AppError } from '../../common/errors';
import { parseInput } from '../../common/validation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PermissionSyncService } from '../access-control/permission-sync.service';
import { AuditService } from '../audit/audit.service';
import { IdentityProvider } from './identity-provider';
import { displayNameSchema, emailSchema, usernameSchema } from './identity-schemas';
import { PasswordPolicy } from './password-policy';

export class BootstrapRefusedError extends Error {
  constructor() {
    super('An active platform administrator already exists. Bootstrap refused.');
    this.name = 'BootstrapRefusedError';
  }
}

const inputSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  email: emailSchema.optional(),
});

/**
 * Creates the first platform administrator (P3-D9). There is no default account and no fixed
 * password: the operator supplies the password interactively and must change it at first login.
 */
@Injectable()
export class BootstrapAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityProvider,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly permissionSync: PermissionSyncService,
    private readonly audit: AuditService,
  ) {}

  async platformAdminExists(): Promise<boolean> {
    const count = await this.prisma.platformRoleAssignment.count({
      where: { role: { key: 'SUPER_ADMIN', tenantId: null }, user: { status: 'ACTIVE' } },
    });
    return count > 0;
  }

  async createInitialPlatformAdmin(input: {
    username: string;
    displayName: string;
    email?: string;
    password: string;
  }): Promise<{ userId: string; username: string }> {
    const { username, displayName, email } = parseInput(inputSchema, input);
    this.passwordPolicy.assertAcceptable(input.password, username);
    const credentials = this.identity.credentials;
    if (!credentials) throw new Error('The configured identity provider does not manage passwords.');

    await this.permissionSync.sync();

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('platform-admin-bootstrap'))`;
      const existing = await tx.platformRoleAssignment.count({
        where: { role: { key: 'SUPER_ADMIN', tenantId: null }, user: { status: 'ACTIVE' } },
      });
      if (existing > 0) throw new BootstrapRefusedError();
      if (await tx.user.findUnique({ where: { username }, select: { id: true } })) {
        throw AppError.conflict('The username is not available.');
      }

      const role = await tx.role.findFirstOrThrow({ where: { key: 'SUPER_ADMIN', tenantId: null }, select: { id: true } });
      const user = await tx.user.create({
        data: { username, displayName, email: email ?? null, status: 'ACTIVE' },
        select: { id: true, username: true },
      });
      await credentials.setPassword(user.id, input.password, { mustChange: true }, tx);
      await tx.platformRoleAssignment.create({ data: { userId: user.id, roleId: role.id } });
      await this.audit.record(
        {
          action: 'PLATFORM_ADMIN_BOOTSTRAPPED',
          category: 'SYSTEM',
          actorType: 'SYSTEM',
          actorUserId: null,
          tenantId: null,
          resourceType: 'user',
          resourceId: user.id,
          after: { username, displayName, email: email ?? null, role: 'SUPER_ADMIN', mustChange: true },
        },
        tx,
      );
      return { userId: user.id, username: user.username };
    });
  }
}
