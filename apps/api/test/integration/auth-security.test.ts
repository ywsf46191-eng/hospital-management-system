// Requires running infrastructure (docker compose up -d --wait). Uses a disposable `<db>_test` database.
import { loadRootEnv } from '../../src/config/load-env';
loadRootEnv(__dirname);

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { runWithRequestContext, runWithTenant } from '../../src/common/request-context';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import {
  AUTHENTICATED_ONLY,
  IS_PUBLIC,
  REQUIRED_PERMISSIONS,
} from '../../src/modules/access-control/decorators';
import { isKnownPermission } from '../../src/modules/access-control/permission-registry';
import { BootstrapAdminService, BootstrapRefusedError } from '../../src/modules/identity/bootstrap-admin.service';
import { TenantPrismaService } from '../../src/modules/tenancy/tenant-prisma.service';
import { Fixtures, testPassword, uniqueName } from './support/fixtures';
import { ApiClient, prepareTestDatabase, startTestApp, type TestApp } from './support/test-app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- response payloads are asserted field by field
type Body = { success: boolean; data?: any; error?: { code: string; message: string } };

const RATE_LIMIT_PER_USERNAME = 40;
const usedPasswords: string[] = [];

describe('Phase 3 authentication and authorization', () => {
  let testApp: TestApp;
  let prisma: PrismaService;
  let fx: Fixtures;
  let hospitalA: { id: string };
  let hospitalB: { id: string };
  let adminA: Awaited<ReturnType<Fixtures['member']>>;
  let adminB: Awaited<ReturnType<Fixtures['member']>>;

  const client = () => new ApiClient(testApp.baseUrl);
  async function signedIn(user: { username: string; password: string }) {
    usedPasswords.push(user.password);
    const api = client();
    const response = await api.login(user.username, user.password);
    assert.equal(response.status, 200, `login failed for ${user.username}: ${JSON.stringify(response.body)}`);
    return api;
  }

  before(async () => {
    await prepareTestDatabase();
    testApp = await startTestApp({
      AUTH_RATE_LIMIT_MAX_PER_IP: '100000',
      AUTH_RATE_LIMIT_MAX_PER_USERNAME: String(RATE_LIMIT_PER_USERNAME),
    });
    prisma = testApp.app.get(PrismaService);
    fx = new Fixtures(prisma);
    hospitalA = await fx.hospital('A');
    hospitalB = await fx.hospital('B');
    adminA = await fx.member(hospitalA.id, 'HOSPITAL_ADMIN');
    adminB = await fx.member(hospitalB.id, 'HOSPITAL_ADMIN');
  });

  after(async () => {
    await testApp?.app.close();
  });

  describe('bootstrap', () => {
    it('creates the first platform administrator once, with a forced password change, and refuses a second', async () => {
      const bootstrap = testApp.app.get(BootstrapAdminService);
      const context = { requestId: 'test-bootstrap', ipAddress: null, userAgent: 'test' };
      const password = testPassword();
      usedPasswords.push(password);
      assert.equal(await bootstrap.platformAdminExists(), false);
      const created = await runWithRequestContext(context, () =>
        bootstrap.createInitialPlatformAdmin({ username: uniqueName('root'), displayName: 'Root', password }),
      );
      const credential = await prisma.userCredential.findUniqueOrThrow({ where: { userId: created.userId } });
      assert.equal(credential.mustChange, true);
      assert.match(credential.passwordHash, /^\$argon2id\$/);

      await assert.rejects(
        runWithRequestContext(context, () =>
          bootstrap.createInitialPlatformAdmin({ username: uniqueName('root'), displayName: 'Root 2', password: testPassword() }),
        ),
        BootstrapRefusedError,
      );
      const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: 'PLATFORM_ADMIN_BOOTSTRAPPED' } });
      assert.equal(audit.actorType, 'SYSTEM');
      assert.equal(audit.resourceId, created.userId);
    });

    it('rejects weak bootstrap passwords', async () => {
      await prisma.platformRoleAssignment.deleteMany({});
      const bootstrap = testApp.app.get(BootstrapAdminService);
      await assert.rejects(
        bootstrap.createInitialPlatformAdmin({ username: uniqueName('root'), displayName: 'Root', password: 'short' }),
        /password/i,
      );
    });
  });

  describe('route protection', () => {
    it('keeps health endpoints public', async () => {
      const api = client();
      assert.equal((await api.request('GET', '/health/live')).status, 200);
      assert.notEqual((await api.request('GET', '/health')).status, 401);
    });

    it('declares authorization metadata on every route (default deny) and only three public routes', () => {
      const publicRoutes: string[] = [];
      for (const module of testApp.app.get(ModulesContainer).values()) {
        for (const wrapper of module.controllers.values()) {
          const controller = wrapper.metatype as (new (...args: unknown[]) => unknown) | null;
          if (!controller) continue;
          const prototype = controller.prototype as Record<string, unknown>;
          for (const name of Object.getOwnPropertyNames(prototype)) {
            const handler = prototype[name];
            if (name === 'constructor' || typeof handler !== 'function' || Reflect.getMetadata(PATH_METADATA, handler) === undefined) continue;
            const meta = (key: string) => Reflect.getMetadata(key, handler) ?? Reflect.getMetadata(key, controller);
            const path = `${Reflect.getMetadata(PATH_METADATA, controller)}/${Reflect.getMetadata(PATH_METADATA, handler)}`.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
            const route = `${RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler)]} ${path}`;
            const permissions = meta(REQUIRED_PERMISSIONS) as string[] | undefined;
            assert.ok(meta(IS_PUBLIC) || meta(AUTHENTICATED_ONLY) || permissions?.length, `${route} has no authorization metadata`);
            for (const permission of permissions ?? []) assert.ok(isKnownPermission(permission), `${route}: unknown ${permission}`);
            if (meta(IS_PUBLIC)) publicRoutes.push(route);
          }
        }
      }
      assert.deepEqual(publicRoutes.sort(), ['GET health', 'GET health/live', 'POST auth/login'].sort());
    });

    it('rejects protected routes without a valid session', async () => {
      const api = client();
      const anonymous = await api.request('GET', '/users');
      assert.equal(anonymous.status, 401);
      assert.equal((anonymous.body as Body).error?.code, 'AUTH_REQUIRED');
      api.sessionToken = 'A'.repeat(43);
      assert.equal((await api.request('GET', '/auth/me')).status, 401);
    });
  });

  describe('login', () => {
    it('issues a hashed, HttpOnly, Secure, SameSite session cookie', async () => {
      const api = client();
      const response = await api.login(adminA.username.toUpperCase(), adminA.password);
      usedPasswords.push(adminA.password);
      assert.equal(response.status, 200);
      const cookie = response.setCookies.find((value) => value.startsWith('hospital_session='));
      assert.ok(cookie);
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /Secure/i);
      assert.match(cookie, /SameSite=Lax/i);
      assert.ok(!JSON.stringify(response.body).includes(api.sessionToken as string), 'token must not be in the body');

      const tokenHash = createHash('sha256').update(api.sessionToken as string).digest('hex');
      const session = await prisma.session.findUniqueOrThrow({ where: { tokenHash } });
      assert.equal(session.userId, adminA.id);
      assert.equal(session.tenantId, hospitalA.id, 'single membership selects the tenant');

      const me = await api.request('GET', '/auth/me');
      assert.equal(me.status, 200);
      const data = (me.body as Body).data;
      assert.equal(data.activeTenant.id, hospitalA.id);
      assert.ok(data.permissions.includes('user.read'));
      assert.ok(!data.permissions.some((key: string) => key.startsWith('tenant.')), 'no platform permissions');
    });

    it('returns the same generic error for unknown users and wrong passwords', async () => {
      const unknown = await client().login(uniqueName('nobody'), testPassword());
      const wrong = await client().login(adminB.username, testPassword());
      assert.equal(unknown.status, 401);
      assert.equal(wrong.status, 401);
      assert.equal((unknown.body as Body).error?.code, 'AUTH_INVALID');
      assert.deepEqual((unknown.body as Body).error, (wrong.body as Body).error);
      const failed = await prisma.auditLog.findFirst({ where: { action: 'LOGIN_FAILED', actorUserId: adminB.id } });
      assert.equal(failed?.reason, 'INVALID_CREDENTIALS');
    });

    it('locks the account after 5 failures, even for the correct password', async () => {
      const user = await fx.member(hospitalA.id, 'RECEPTIONIST');
      usedPasswords.push(user.password);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        assert.equal((await client().login(user.username, testPassword())).status, 401);
      }
      const locked = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      assert.ok(locked.lockedUntil && locked.lockedUntil > new Date());
      assert.equal((await client().login(user.username, user.password)).status, 401);
      assert.ok(await prisma.auditLog.findFirst({ where: { action: 'ACCOUNT_LOCKED', resourceId: user.id } }));

      await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() - 1000) } });
      assert.equal((await client().login(user.username, user.password)).status, 200, 'unlocks after the lockout period');
    });

    it('rate limits attempts per username', async () => {
      const username = uniqueName('flood');
      const statuses: number[] = [];
      for (let attempt = 0; attempt <= RATE_LIMIT_PER_USERNAME; attempt += 1) {
        statuses.push((await client().login(username, testPassword())).status);
      }
      assert.equal(statuses.at(-1), 429);
      assert.ok(statuses.slice(0, RATE_LIMIT_PER_USERNAME).every((status) => status === 401));
    });

    it('refuses suspended, disabled and pending accounts and inactive memberships', async () => {
      for (const status of ['SUSPENDED', 'DISABLED', 'PENDING'] as const) {
        const user = await fx.user({ status });
        await fx.membership(user.id, hospitalA.id);
        assert.equal((await client().login(user.username, user.password)).status, 401, status);
      }
      const suspendedMember = await fx.user();
      await fx.membership(suspendedMember.id, hospitalA.id, 'SUSPENDED');
      assert.equal((await client().login(suspendedMember.username, suspendedMember.password)).status, 401);
      const noAccess = await fx.user();
      assert.equal((await client().login(noAccess.username, noAccess.password)).status, 401);
    });

    it('rejects unknown fields in the login body', async () => {
      const response = await client().request('POST', '/auth/login', {
        body: { username: adminA.username, password: adminA.password, tenantId: hospitalB.id },
      });
      assert.equal(response.status, 400);
    });
  });

  describe('CSRF and origin', () => {
    it('requires the CSRF token on unsafe requests and rejects foreign origins', async () => {
      const api = await signedIn(adminA);
      const missing = await api.request('POST', '/auth/logout', { csrf: false });
      assert.equal(missing.status, 403);
      assert.equal((missing.body as Body).error?.code, 'CSRF_INVALID');
      assert.equal((await api.request('POST', '/auth/logout', { csrf: 'x'.repeat(43) })).status, 403);
      assert.equal((await api.request('POST', '/auth/logout', { headers: { origin: 'https://evil.example' } })).status, 403);
      const foreignLogin = await client().login(adminA.username, adminA.password, { origin: 'https://evil.example' });
      assert.equal(foreignLogin.status, 403);
      assert.ok(await prisma.auditLog.findFirst({ where: { action: 'CSRF_REJECTED', actorUserId: adminA.id } }));
    });
  });

  describe('sessions', () => {
    it('revokes the session on logout', async () => {
      const api = await signedIn(adminA);
      const token = api.sessionToken;
      assert.equal((await api.request('POST', '/auth/logout')).status, 204);
      api.sessionToken = token;
      assert.equal((await api.request('GET', '/auth/me')).status, 401);
    });

    it('expires idle and absolute sessions', async () => {
      for (const field of ['idleExpiresAt', 'absoluteExpiresAt'] as const) {
        const api = await signedIn(adminA);
        const tokenHash = createHash('sha256').update(api.sessionToken as string).digest('hex');
        const past = new Date(Date.now() - 1000);
        const data = field === 'idleExpiresAt' ? { idleExpiresAt: past } : { absoluteExpiresAt: past, idleExpiresAt: past, createdAt: new Date(Date.now() - 2000) };
        await prisma.session.update({ where: { tokenHash }, data });
        const response = await api.request('GET', '/auth/me');
        assert.equal(response.status, 401, field);
        assert.equal((response.body as Body).error?.code, 'AUTH_EXPIRED');
        const session = await prisma.session.findUniqueOrThrow({ where: { tokenHash } });
        assert.ok(session.revokedAt, 'expired sessions are revoked');
      }
    });

    it('lists and revokes only the caller’s own sessions', async () => {
      const first = await signedIn(adminB);
      const second = await signedIn(adminB);
      const sessions = (await first.request('GET', '/auth/sessions')).body as Body;
      const other = sessions.data.find((session: { current: boolean }) => !session.current);
      assert.ok(other);
      const otherTenantAdmin = await signedIn(adminA);
      assert.equal((await otherTenantAdmin.request('DELETE', `/auth/sessions/${other.id}`)).status, 404);
      assert.equal((await first.request('DELETE', `/auth/sessions/${other.id}`)).status, 204);
      assert.equal((await second.request('GET', '/auth/me')).status, 401);
    });

    it('forces a password change, rotates the token and revokes other sessions', async () => {
      const user = await fx.member(hospitalA.id, 'RECEPTIONIST', { mustChange: true });
      const other = await signedIn(user);
      const api = await signedIn(user);
      const blocked = await api.request('GET', '/auth/sessions');
      assert.equal(blocked.status, 403);
      assert.equal((blocked.body as Body).error?.code, 'PASSWORD_CHANGE_REQUIRED');
      assert.equal(((await api.request('GET', '/auth/me')).body as Body).data.passwordChangeRequired, true);

      const weak = await api.request('POST', '/auth/password/change', { body: { currentPassword: user.password, newPassword: 'short' } });
      assert.equal(weak.status, 422);
      const oldToken = api.sessionToken;
      const newPassword = testPassword();
      usedPasswords.push(newPassword);
      const changed = await api.request('POST', '/auth/password/change', { body: { currentPassword: user.password, newPassword } });
      assert.equal(changed.status, 200);
      assert.notEqual(api.sessionToken, oldToken, 'token rotated');
      assert.equal((await api.request('GET', '/auth/sessions')).status, 200);
      assert.equal((await other.request('GET', '/auth/me')).status, 401, 'other sessions revoked');
      const stale = client();
      stale.sessionToken = oldToken;
      assert.equal((await stale.request('GET', '/auth/me')).status, 401, 'old token invalid');
    });
  });

  describe('tenant isolation', () => {
    it('never exposes another hospital’s users', async () => {
      const api = await signedIn(adminA);
      const list = (await api.request('GET', '/users?pageSize=100')).body as Body;
      const ids = list.data.items.map((user: { id: string }) => user.id);
      assert.ok(ids.includes(adminA.id));
      assert.ok(!ids.includes(adminB.id));
      assert.equal((await api.request('GET', `/users/${adminB.id}`)).status, 404);
      assert.equal((await api.request('PATCH', `/users/${adminB.id}`, { body: { displayName: 'x' } })).status, 404);
      assert.equal((await api.request('POST', `/users/${adminB.id}/password-reset`, { body: { temporaryPassword: testPassword() } })).status, 404);
    });

    it('rejects client-supplied tenant identifiers', async () => {
      const api = await signedIn(adminA);
      assert.equal((await api.request('GET', `/users?tenantId=${hospitalB.id}`)).status, 400);
      const create = await api.request('POST', '/users', {
        body: { username: uniqueName('x'), displayName: 'X', temporaryPassword: testPassword(), tenantId: hospitalB.id },
      });
      assert.equal(create.status, 400);
      const department = await api.request('POST', '/departments', { body: { code: 'ER', name: 'Emergency', tenantId: hospitalB.id } });
      assert.equal(department.status, 400);
    });

    it('cannot use another hospital’s roles or departments', async () => {
      const roleB = await fx.customRole(hospitalB.id, ['user.read']);
      const departmentB = await prisma.department.create({ data: { tenantId: hospitalB.id, code: uniqueName('D'), name: 'B dept' } });
      const target = await fx.member(hospitalA.id, null);
      const api = await signedIn(adminA);
      assert.equal((await api.request('POST', `/users/${target.id}/roles`, { body: { roleId: roleB.id } })).status, 404);
      assert.equal((await api.request('GET', `/roles/${roleB.id}`)).status, 404);
      assert.equal((await api.request('POST', `/users/${target.id}/departments`, { body: { departmentId: departmentB.id } })).status, 404);
      assert.equal((await api.request('POST', `/departments/${departmentB.id}/disable`)).status, 404);
    });

    it('requires an explicit hospital selection for multi-hospital users', async () => {
      const user = await fx.user();
      await fx.membership(user.id, hospitalA.id);
      await fx.membership(user.id, hospitalB.id);
      await fx.assignTemplate(user.id, hospitalA.id, 'HOSPITAL_ADMIN');
      const api = await signedIn(user);
      const noTenant = await api.request('GET', '/users');
      assert.equal(noTenant.status, 403);
      assert.equal((noTenant.body as Body).error?.code, 'TENANT_CONTEXT_REQUIRED');

      const outsider = await fx.hospital('C');
      assert.equal((await api.request('POST', '/auth/tenant', { body: { tenantId: outsider.id } })).status, 403);
      const before = api.sessionToken;
      assert.equal((await api.request('POST', '/auth/tenant', { body: { tenantId: hospitalA.id } })).status, 200);
      assert.notEqual(api.sessionToken, before, 'token rotated on tenant switch');
      assert.equal((await api.request('GET', '/users')).status, 200);
      assert.equal((await api.request('POST', '/auth/tenant', { body: { tenantId: hospitalB.id } })).status, 200);
      assert.equal((await api.request('GET', '/users')).status, 403, 'roles do not carry across hospitals');
    });

    it('filters tenant models automatically and fails closed without a tenant', async () => {
      const db = testApp.app.get(TenantPrismaService).client;
      await prisma.department.create({ data: { tenantId: hospitalA.id, code: uniqueName('D'), name: 'A dept' } });
      // Prisma queries are lazy: they must be awaited inside the tenant context.
      const rows = await runWithTenant(hospitalA.id, async () => await db.department.findMany());
      assert.ok(rows.length > 0 && rows.every((row) => row.tenantId === hospitalA.id));
      await assert.rejects(() => db.department.findMany(), /hospital must be selected/);
      await assert.rejects(
        () => runWithTenant(hospitalA.id, async () => await db.department.create({ data: { tenantId: hospitalB.id, code: 'X1', name: 'x' } })),
        /Cross-tenant/,
      );
    });
  });

  describe('authorization', () => {
    it('denies missing permissions and audits the denial', async () => {
      const receptionist = await fx.member(hospitalA.id, 'RECEPTIONIST');
      const api = await signedIn(receptionist);
      const response = await api.request('GET', '/users');
      assert.equal(response.status, 403);
      assert.equal((response.body as Body).error?.code, 'ACCESS_DENIED');
      const audit = await prisma.auditLog.findFirst({ where: { action: 'PERMISSION_DENIED', actorUserId: receptionist.id } });
      assert.ok(audit);
      assert.equal(audit.result, 'DENIED');
      assert.equal((audit.metadata as { permission: string }).permission, 'user.read');
    });

    it('allows and denies per permission (allowed/denied pairs)', async () => {
      const reader = await fx.user();
      await fx.membership(reader.id, hospitalA.id);
      const role = await fx.customRole(hospitalA.id, ['department.read']);
      await prisma.roleAssignment.create({ data: { tenantId: hospitalA.id, userId: reader.id, roleId: role.id } });
      const api = await signedIn(reader);
      assert.equal((await api.request('GET', '/departments')).status, 200);
      assert.equal((await api.request('POST', '/departments', { body: { code: 'NEW1', name: 'New' } })).status, 403);
      assert.equal((await api.request('GET', '/roles')).status, 403);
      assert.equal((await api.request('GET', '/audit-logs')).status, 403);
      assert.equal((await api.request('GET', '/platform/hospitals')).status, 403);
    });

    it('ignores expired role assignments and department-scoped grants for hospital-wide actions', async () => {
      const user = await fx.user();
      await fx.membership(user.id, hospitalA.id);
      const role = await fx.customRole(hospitalA.id, ['department.read']);
      await prisma.roleAssignment.create({
        data: { tenantId: hospitalA.id, userId: user.id, roleId: role.id, validFrom: new Date(Date.now() - 10_000), validUntil: new Date(Date.now() - 5000) },
      });
      const scoped = await fx.customRole(hospitalA.id, []);
      await prisma.rolePermission.create({ data: { roleId: scoped.id, permissionKey: 'user.read', scope: 'DEPARTMENT' } });
      await prisma.roleAssignment.create({ data: { tenantId: hospitalA.id, userId: user.id, roleId: scoped.id } });
      const api = await signedIn(user);
      assert.equal((await api.request('GET', '/departments')).status, 403);
      assert.equal((await api.request('GET', '/users')).status, 403);
    });

    it('blocks privilege escalation through role assignment and role editing', async () => {
      const manager = await fx.user();
      await fx.membership(manager.id, hospitalA.id);
      const managerRole = await fx.customRole(hospitalA.id, ['user.read', 'role.read', 'role.assign', 'role.update']);
      await prisma.roleAssignment.create({ data: { tenantId: hospitalA.id, userId: manager.id, roleId: managerRole.id } });
      const target = await fx.member(hospitalA.id, null);
      const adminTemplate = await prisma.role.findFirstOrThrow({ where: { key: 'HOSPITAL_ADMIN', tenantId: null } });
      const api = await signedIn(manager);

      assert.equal((await api.request('POST', `/users/${target.id}/roles`, { body: { roleId: adminTemplate.id } })).status, 403);
      assert.equal((await api.request('POST', `/users/${manager.id}/roles`, { body: { roleId: managerRole.id } })).status, 403, 'no self-assignment');
      assert.equal((await api.request('POST', `/roles/${managerRole.id}/permissions`, { body: { permission: 'user.create' } })).status, 403);
      assert.equal((await api.request('PATCH', `/roles/${adminTemplate.id}`, { body: { name: 'Mine' } })).status, 403, 'templates are read-only');
      assert.ok(await prisma.auditLog.findFirst({ where: { action: 'PRIVILEGE_ESCALATION_DENIED', actorUserId: manager.id } }));
      assert.equal(await prisma.roleAssignment.count({ where: { userId: target.id } }), 0);
    });

    it('rejects platform-only permissions and GLOBAL scope on hospital roles', async () => {
      const api = await signedIn(adminA);
      const created = await api.request('POST', '/roles', { body: { key: uniqueName('ROLE_').toUpperCase(), name: 'Clerks' } });
      assert.equal(created.status, 201);
      const roleId = (created.body as Body).data.id;
      assert.equal((await api.request('POST', `/roles/${roleId}/permissions`, { body: { permission: 'tenant.create' } })).status, 400);
      assert.equal((await api.request('POST', `/roles/${roleId}/permissions`, { body: { permission: 'user.read', scope: 'GLOBAL' } })).status, 400);
      assert.equal((await api.request('POST', `/roles/${roleId}/permissions`, { body: { permission: 'user.read' } })).status, 201);
      assert.equal((await api.request('POST', '/roles', { body: { key: 'HOSPITAL_ADMIN', name: 'Fake' } })).status, 409);
    });

    it('separates platform administration from hospital data', async () => {
      const root = await fx.platformAdmin();
      const api = await signedIn(root);
      assert.equal((await api.request('GET', '/platform/hospitals')).status, 200);
      const users = await api.request('GET', '/users');
      assert.equal(users.status, 403, 'platform roles do not bypass tenant isolation');

      const created = await api.request('POST', '/platform/hospitals', { body: { code: uniqueName('P'), name: 'New', type: 'PRIVATE' } });
      assert.equal(created.status, 201);
      const hospitalId = (created.body as Body).data.id;
      const admin = { username: uniqueName('hadmin'), password: testPassword() };
      const createdAdmin = await api.request('POST', `/platform/hospitals/${hospitalId}/administrators`, {
        body: { username: admin.username, displayName: 'Admin', temporaryPassword: admin.password },
      });
      assert.equal(createdAdmin.status, 201);
      const hospitalAdmin = await signedIn(admin);
      assert.equal((await hospitalAdmin.request('GET', '/users')).status, 403, 'temporary password must be changed');
      assert.equal((await hospitalAdmin.request('GET', '/platform/hospitals')).status, 403);
    });
  });

  describe('administration', () => {
    it('creates users, resets passwords and suspends memberships with session revocation', async () => {
      const api = await signedIn(adminA);
      const password = testPassword();
      usedPasswords.push(password);
      const created = await api.request('POST', '/users', {
        body: { username: uniqueName('staff'), displayName: 'Staff', temporaryPassword: password },
      });
      assert.equal(created.status, 201);
      const user = (created.body as Body).data;
      assert.equal(user.membershipStatus, 'ACTIVE');

      const target = await signedIn({ username: user.username, password });
      const reset = testPassword();
      usedPasswords.push(reset);
      assert.equal((await api.request('POST', `/users/${user.id}/password-reset`, { body: { temporaryPassword: reset } })).status, 204);
      assert.equal((await target.request('GET', '/auth/me')).status, 401, 'reset revokes sessions');
      assert.equal((await client().login(user.username, password)).status, 401, 'old password invalid');
      const relogin = await signedIn({ username: user.username, password: reset });
      assert.equal((await api.request('POST', `/users/${user.id}/suspend`)).status, 200);
      assert.equal((await relogin.request('GET', '/auth/me')).status, 401, 'suspension revokes sessions');
      assert.equal((await api.request('POST', `/users/${adminA.id}/suspend`)).status, 403, 'cannot suspend yourself');
    });
  });

  describe('audit log', () => {
    it('is append-only at the database level', async () => {
      const row = await prisma.auditLog.findFirstOrThrow();
      await assert.rejects(prisma.$executeRaw`UPDATE audit_logs SET action = 'TAMPERED' WHERE id = ${row.id}::uuid`);
      await assert.rejects(prisma.$executeRaw`DELETE FROM audit_logs WHERE id = ${row.id}::uuid`);
      await assert.rejects(prisma.$executeRawUnsafe('TRUNCATE audit_logs'));
      const unchanged = await prisma.auditLog.findUniqueOrThrow({ where: { id: row.id } });
      assert.equal(unchanged.action, row.action);
    });

    it('records authentication events and never stores secrets', async () => {
      for (const action of ['LOGIN_SUCCEEDED', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'ROLE_CREATED', 'USER_CREATED', 'PASSWORD_RESET_BY_ADMIN']) {
        assert.ok(await prisma.auditLog.findFirst({ where: { action } }), `missing ${action}`);
      }
      const dump = JSON.stringify(await prisma.auditLog.findMany());
      for (const password of usedPasswords) assert.ok(!dump.includes(password), 'password leaked into audit log');
      assert.ok(!dump.includes('$argon2'), 'password hash leaked into audit log');
      const tokens = await prisma.session.findMany({ select: { tokenHash: true } });
      for (const { tokenHash } of tokens) assert.ok(!dump.includes(tokenHash), 'session token hash leaked');
    });

    it('scopes audit queries to the active hospital', async () => {
      const api = await signedIn(adminB);
      const response = await api.request('GET', '/audit-logs?pageSize=100');
      assert.equal(response.status, 200);
      const items = (response.body as Body).data.items as { tenantId: string }[];
      assert.ok(items.every((item) => item.tenantId === hospitalB.id));
    });
  });
});
