import { Global, Module } from '@nestjs/common';
import { AccessGuard } from './access-control/access.guard';
import { PermissionSyncService } from './access-control/permission-sync.service';
import { PermissionService } from './access-control/permission.service';
import { AuditLogQueryService, AuditLogsController } from './audit/audit-logs.controller';
import { AuditService } from './audit/audit.service';
import { AuthController } from './identity/auth.controller';
import { AuthService } from './identity/auth.service';
import { BootstrapAdminService } from './identity/bootstrap-admin.service';
import { IdentityProvider } from './identity/identity-provider';
import { LocalIdentityProvider } from './identity/local-identity.provider';
import { LoginRateLimiter } from './identity/login-rate-limiter';
import { DisabledMfaPolicy, MfaPolicy } from './identity/mfa-policy';
import { PasswordHasher } from './identity/password-hasher';
import { PasswordPolicy } from './identity/password-policy';
import { SessionCookie } from './identity/session-cookie';
import { SessionService } from './identity/session.service';
import { TenantPrismaService } from './tenancy/tenant-prisma.service';

/**
 * Identity, sessions, tenant context, RBAC and audit. Global so business modules can inject
 * PermissionService, AuditService and TenantPrismaService without importing it.
 */
@Global()
@Module({
  controllers: [AuthController, AuditLogsController],
  providers: [
    AuditService,
    AuditLogQueryService,
    TenantPrismaService,
    PermissionService,
    PermissionSyncService,
    PasswordHasher,
    PasswordPolicy,
    LocalIdentityProvider,
    { provide: IdentityProvider, useExisting: LocalIdentityProvider },
    { provide: MfaPolicy, useClass: DisabledMfaPolicy },
    LoginRateLimiter,
    SessionService,
    SessionCookie,
    AuthService,
    BootstrapAdminService,
    AccessGuard,
  ],
  exports: [
    AuditService,
    TenantPrismaService,
    PermissionService,
    PermissionSyncService,
    PasswordPolicy,
    IdentityProvider,
    SessionService,
    SessionCookie,
    BootstrapAdminService,
    AccessGuard,
  ],
})
export class SecurityModule {}
