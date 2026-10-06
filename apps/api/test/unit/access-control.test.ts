import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PERMISSIONS, PERMISSION_KEY_PATTERN } from '../../src/modules/access-control/permission-registry';
import { validateRegistry } from '../../src/modules/access-control/permission-sync.service';
import { PermissionService } from '../../src/modules/access-control/permission.service';
import type { AuthPrincipal, PermissionGrant } from '../../src/modules/access-control/principal';
import { ROLE_TEMPLATES } from '../../src/modules/access-control/role-templates';
import { scopeTenantQuery, TenantIsolationError } from '../../src/modules/tenancy/tenant-prisma.service';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';

const TENANT = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const DEPT = '33333333-3333-4333-8333-333333333333';

function principal(grants: PermissionGrant[], tenantId: string | null = TENANT): AuthPrincipal {
  return { userId: 'u1', sessionId: 's1', tenantId, session: {} as AuthPrincipal['session'], sessionToken: 't', grants };
}

const grant = (permission: string, scope: PermissionGrant['scope'] = 'HOSPITAL', departmentId: string | null = null): PermissionGrant => ({
  permission,
  scope,
  tenantId: scope === 'GLOBAL' ? null : TENANT,
  departmentId,
});

const noDb = {
  userDepartment: { findFirst: async () => null },
} as unknown as PrismaService;

describe('permission registry', () => {
  it('is valid and uses <resource>.<action> keys', () => {
    assert.doesNotThrow(() => validateRegistry());
    for (const permission of PERMISSIONS) assert.match(permission.key, PERMISSION_KEY_PATTERN);
    assert.ok(PERMISSIONS.some((permission) => permission.key === 'patient.read'));
  });

  it('defines the system role templates with permissions matching their level', () => {
    assert.ok(ROLE_TEMPLATES.length >= 25);
    const superAdmin = ROLE_TEMPLATES.find((role) => role.key === 'SUPER_ADMIN');
    assert.equal(superAdmin?.level, 'PLATFORM');
    assert.ok(!superAdmin?.permissions.includes('patient.read'), 'platform role holds no clinical permissions');
  });
});

describe('PermissionService.can', () => {
  const service = new PermissionService(noDb);

  it('allows granted permissions and denies everything else (default deny)', async () => {
    const p = principal([grant('user.read')]);
    assert.deepEqual(await service.can(p, 'user.read'), { allowed: true });
    assert.deepEqual(await service.can(p, 'user.create'), { allowed: false, reason: 'NO_PERMISSION' });
    assert.deepEqual(await service.can(p, 'made.up'), { allowed: false, reason: 'UNKNOWN_PERMISSION' });
  });

  it('denies permissions of modules that are not enabled yet', async () => {
    assert.deepEqual(await service.can(principal([grant('patient.read')]), 'patient.read'), {
      allowed: false,
      reason: 'MODULE_NOT_ENABLED',
    });
  });

  it('requires a tenant context for tenant permissions', async () => {
    assert.deepEqual(await service.can(principal([grant('user.read')], null), 'user.read'), {
      allowed: false,
      reason: 'TENANT_CONTEXT_REQUIRED',
    });
  });

  it('enforces resource tenant and scope', async () => {
    const p = principal([grant('user.read')]);
    assert.deepEqual(await service.can(p, 'user.read', { tenantId: OTHER }), { allowed: false, reason: 'TENANT_MISMATCH' });
    const deptScoped = principal([grant('department.read', 'DEPARTMENT', DEPT)]);
    assert.deepEqual(await service.can(deptScoped, 'department.read'), { allowed: false, reason: 'SCOPE_DENIED' });
    assert.deepEqual(await service.can(deptScoped, 'department.read', { tenantId: TENANT, departmentId: DEPT }), { allowed: true });
    assert.deepEqual(await service.can(deptScoped, 'department.read', { tenantId: TENANT, departmentId: OTHER }), {
      allowed: false,
      reason: 'SCOPE_DENIED',
    });
    const own = principal([grant('user.read', 'OWN_RECORD')]);
    assert.deepEqual(await service.can(own, 'user.read', { tenantId: TENANT, ownerUserId: 'u1' }), { allowed: true });
    assert.equal((await service.can(own, 'user.read', { tenantId: TENANT, ownerUserId: 'u2' })).allowed, false);
  });

  it('reports missing permissions for the escalation guard', async () => {
    const p = principal([grant('user.read'), grant('role.assign')]);
    assert.deepEqual(await service.holdsAll(p, ['user.read', 'user.create']), ['user.create']);
  });
});

describe('scopeTenantQuery', () => {
  it('adds the tenant filter to reads and updates', () => {
    const args = scopeTenantQuery('Department', 'findMany', { where: { code: 'ER' } }, TENANT);
    assert.deepEqual(args.where, { code: 'ER', AND: [{ tenantId: TENANT }] });
    const update = scopeTenantQuery('Department', 'update', { where: { id: 'x' }, data: { name: 'n' } }, TENANT);
    assert.deepEqual(update.where, { id: 'x', AND: [{ tenantId: TENANT }] });
  });

  it('shows templates on role reads but restricts role writes to the tenant', () => {
    const read = scopeTenantQuery('Role', 'findMany', {}, TENANT);
    assert.deepEqual(read.where, { AND: [{ OR: [{ tenantId: TENANT }, { tenantId: null }] }] });
    const write = scopeTenantQuery('Role', 'updateMany', { data: {} }, TENANT);
    assert.deepEqual(write.where, { AND: [{ tenantId: TENANT }] });
  });

  it('stamps creates and rejects cross-tenant writes', () => {
    assert.equal((scopeTenantQuery('Department', 'create', { data: { code: 'A' } }, TENANT).data as { tenantId: string }).tenantId, TENANT);
    assert.throws(() => scopeTenantQuery('Department', 'create', { data: { tenantId: OTHER } }, TENANT), TenantIsolationError);
    assert.throws(() => scopeTenantQuery('Department', 'update', { where: {}, data: { tenantId: OTHER } }, TENANT), TenantIsolationError);
    assert.throws(() => scopeTenantQuery('Department', 'create', { data: { hospital: { connect: { id: OTHER } } } }, TENANT), TenantIsolationError);
  });
});
