# Authentication & Authorization

Phase 3 implementation. Decisions: ADP-003, ADP-004, ADP-006 (P3-D0–P3-D12).

## 1. Decisions implemented

| ID | Choice |
| --- | --- |
| P3-D0 | Authentication and authorization together as Phase 3. Minimal login/admin UI only. Design System remains Phase 4. |
| P3-D1 | Local Argon2id behind `IdentityProvider`. No Keycloak. |
| P3-D2 | Tenant identifier is `tenant_id` everywhere. A Hospital is a tenant. |
| P3-D3 | `UserHospitalMembership`. Users may belong to several hospitals. Active tenant comes from the session. User ≠ Staff. |
| P3-D4 | Opaque server-side sessions in PostgreSQL. Cookie: Secure + HttpOnly + SameSite=Lax. Token hash only. Idle, absolute, revoke. CSRF for cookie auth. Redis may rate-limit; PostgreSQL is authoritative for sessions. |
| P3-D5 | Permission keys: `<resource>.<action>` (`patient.read`, not `module.resource.action`). |
| P3-D6 | Permission registry in code, seeded to PostgreSQL. Roles are data. Authorize with `PermissionService.can()`, not role names. System templates do not bypass tenant isolation. |
| P3-D7 | Application-layer tenant isolation with automatic Prisma filtering. PostgreSQL RLS is a production-hardening requirement, not implemented here (the current application database user is a superuser). |
| P3-D8 | MFA-ready interfaces only (`AUTH_MFA_MODE=disabled`). No TOTP. No self-service email reset. Admin-initiated password reset exists. Department and Hospital exist. |
| P3-D9 | `pnpm auth:bootstrap`: interactive password, no default account, refuses a second platform admin, first-login password change, audited. |
| P3-D10 | Defaults: password ≥ 12; lockout 5 / 15 min; idle 30 min; absolute 12 h; rate limit per IP and username. All configurable. |
| P3-D11 | Append-only `audit_logs` (UPDATE/DELETE/TRUNCATE rejected). Authn/authz/user/role/permission events. No passwords, tokens or secrets. Permission denials recorded. Audit in the same transaction as the mutation. |
| P3-D12 | Argon2id (`@node-rs/argon2`) and Helmet. No MFA or Keycloak packages. |

## 2. Authentication

### Identity provider

`IdentityProvider` is a port (`apps/api/src/modules/identity/identity-provider.ts`). Business modules never hash passwords or talk to an IdP. The Phase 3 implementation is `LocalIdentityProvider`:

- Usernames are stored lowercase and globally unique.
- Password hashes live in `user_credentials` (Argon2id: memory 19456 KiB, time 2, parallelism 1, 32-byte output).
- Unknown users still run a dummy verify so timing does not leak existence.
- A future Keycloak/OIDC provider would implement `authenticate()` and leave `credentials` as `null`.

MFA: `MfaPolicy` / `DisabledMfaPolicy`. No TOTP library. `mfaVerifiedAt` exists on sessions for later.

### Login

`POST /api/v1/auth/login` is `@Public()`. Flow:

1. Normalize username; consume Redis rate limits (`auth:login:ip:<ip>`, `auth:login:user:<sha256>`). Redis errors fail **open** (login still proceeds; a warning is logged).
2. Authenticate. Failures increment `failed_login_count`. At the threshold the account is locked for `AUTH_LOCKOUT_DURATION_MINUTES`. Locked accounts and non-ACTIVE users receive the same generic `AUTH_INVALID` as a wrong password.
3. There must be at least one ACTIVE membership on an ACTIVE hospital, or an ACTIVE platform role. Otherwise `AUTH_INVALID` (`NO_ACTIVE_ACCESS`).
4. If the user has exactly one such membership, the session’s `tenant_id` is that hospital. Otherwise `tenant_id` is null until `POST /auth/tenant`.
5. Cookie `hospital_session` is set: HttpOnly, Secure (`SESSION_COOKIE_SECURE`, required true in production), SameSite=Lax, Path=/. The body contains only `{ csrfToken }`.

There is no self-service forgotten-password flow. Hospital administrators with `user.password_reset` (or platform `platform.user.manage`) set a temporary password; `must_change` is true and all sessions are revoked.

### Sessions

- Token: 32 random bytes, base64url (43 characters). Only SHA-256 hex is stored (`sessions.token_hash`).
- Idle timeout and absolute lifetime are enforced on every request. Expired sessions are revoked (`EXPIRED_IDLE` / `EXPIRED_ABSOLUTE`).
- Last-seen is updated at most every 60 seconds (idle expiry precision ±1 minute).
- Logout, password change/reset, membership inactivation, user inactivation and hospital suspend revoke relevant sessions.
- Privilege or tenant changes rotate the token (new hash, same session id).

### CSRF and Origin

CSRF token = HMAC-SHA256(key = session token, `"csrf:v1"`), base64url. The browser sends it in `X-CSRF-Token` on unsafe methods. It is held in memory (React context), never in LocalStorage.

On unsafe methods (including public `POST /auth/login`): if an `Origin` header is present it must be listed in `CORS_ORIGINS`. Default is `http://localhost:3000` only; `http://127.0.0.1:3000` is a different origin and is rejected.

## 3. Tenant model

A **Hospital** is a tenant (`hospitals.id` = `tenant_id`). Access is granted only through `user_hospital_memberships`.

The client never supplies the active tenant. `RequestContext.tenantId` is copied from the validated session. Zod schemas are `.strict()`, so a body or query with `tenantId` (except `POST /auth/tenant` and platform membership APIs) is a 400.

`POST /auth/tenant { tenantId }` succeeds only if the caller has an ACTIVE membership on that hospital. The token is rotated.

### Prisma tenant filter

`TenantPrismaService` extends Prisma. For `Department`, `UserHospitalMembership`, `UserDepartment`, `RoleAssignment`:

- Reads and writes are AND-filtered by the active tenant.
- Creates stamp `tenant_id`. A mismatched `tenantId` or a nested `hospital` relation throws `TENANT_ACCESS_DENIED`.
- Updates cannot change `tenant_id`.

For `Role`, reads also include system templates (`tenant_id IS NULL`); writes are tenant-only.

Without an active tenant the extension throws `TENANT_CONTEXT_REQUIRED`.

**Limitation:** `include`/`select` from a non-tenant root (for example `User`) is not filtered. Tenant data must be queried from a tenant-scoped root. Platform administration uses the unscoped `PrismaService` and names `tenantId` explicitly.

Platform permissions never imply hospital data access. A `SUPER_ADMIN` without a membership cannot call `/users`.

## 4. Authorization

### Default deny

Global `AccessGuard`:

1. Origin check on unsafe methods.
2. `@Public()` → allow (health and login only).
3. Validate session cookie → 401 `AUTH_REQUIRED` or `AUTH_EXPIRED`.
4. CSRF on unsafe methods → 403 `CSRF_INVALID`.
5. Populate `RequestContext` and `request.principal`.
6. If `must_change` and the route is not `@AllowPendingPasswordChange()` → 403 `PASSWORD_CHANGE_REQUIRED`.
7. `@Authenticated()` → allow (own-account routes).
8. No `@RequirePermission()` → 403 (default deny) and an error log.
9. `PermissionService.can()` for every required permission. Denials are audited as `PERMISSION_DENIED`.

`GET /api/v1/health` and `GET /api/v1/health/live` remain public.

### Permission registry

Code in `permission-registry.ts` is the source of truth. Keys match `/^[a-z][a-z_]*(\.[a-z][a-z_]*)+$/`. Startup sync (`PermissionSyncService`) upserts permissions and 25 system role templates under an advisory lock; unused permission rows are deactivated, not deleted.

**Levels**

- `PLATFORM` — only platform roles (`platform_role_assignments`).
- `TENANT` — only tenant roles (`role_assignments`).
- `ANY` — currently `system.health.read`.

**Modules.** Core modules always enabled: `platform`, `system`, `administration`, `identity`, `audit`. Permissions in every other module (patients, clinical, finance, …) are denied with `MODULE_NOT_ENABLED` until module activation exists.

**Scopes.** `GLOBAL` (platform grants only), `HOSPITAL`, `DEPARTMENT` (assignment department or `user_departments`), `OWN_RECORD`. `WARD` and `ASSIGNED_PATIENT` are denied until clinical modules exist.

Hospital-wide routes (no resource context) require a `HOSPITAL` or platform `GLOBAL` grant. A department-only grant is not enough to list all users.

**Escalation.** Assigning a role or granting a permission requires the actor to `holdsAll` those permissions. Administrators cannot use admin endpoints on themselves.

System templates (`tenant_id` NULL, `is_system` true) are read-only. Template keys cannot be reused for custom roles. Custom tenant roles cannot hold `PLATFORM` permissions or `GLOBAL` scope.

## 5. Audit

`audit_logs` has no foreign keys (survives user deletion). Triggers reject UPDATE, DELETE and TRUNCATE (`insufficient_privilege`). A database superuser can disable triggers; production must use a non-superuser role (see §8).

`AuditService.record` redacts keys matching `/pass(word)?|secret|token|hash|cookie|authorization|csrf|credential/i`. Pass a transaction client so the audit row commits or rolls back with the mutation.

Representative actions: `LOGIN_SUCCEEDED`, `LOGIN_FAILED`, `LOGIN_RATE_LIMITED`, `ACCOUNT_LOCKED`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET_BY_ADMIN`, `TENANT_SELECTED`, `SESSION_REVOKED`, `PERMISSION_DENIED`, `PRIVILEGE_ESCALATION_DENIED`, `CSRF_REJECTED`, `USER_CREATED`, `MEMBERSHIP_STATUS_CHANGED`, `ROLE_*`, `DEPARTMENT_*`, `TENANT_*`, `PLATFORM_ADMIN_BOOTSTRAPPED`.

## 6. Bootstrap

```bash
pnpm auth:bootstrap
```

Requires a TTY. Prompts for username, display name, optional email, hidden password and confirmation. Creates one ACTIVE user with `must_change=true` and a `SUPER_ADMIN` platform assignment. Refuses if any ACTIVE user already holds `SUPER_ADMIN`. Audits `PLATFORM_ADMIN_BOOTSTRAPPED` (`actorType=SYSTEM`). No default password and no backdoor.

## 7. Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `AUTH_PROVIDER` | `local` | Only `local` in this phase. |
| `AUTH_MFA_MODE` | `disabled` | Only `disabled` in this phase. |
| `AUTH_PASSWORD_MIN_LENGTH` | `12` | Minimum 12. |
| `AUTH_LOCKOUT_THRESHOLD` | `5` | |
| `AUTH_LOCKOUT_DURATION_MINUTES` | `15` | |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | `900` | |
| `AUTH_RATE_LIMIT_MAX_PER_IP` | `100` | |
| `AUTH_RATE_LIMIT_MAX_PER_USERNAME` | `20` | |
| `SESSION_IDLE_TIMEOUT_MINUTES` | `30` | |
| `SESSION_ABSOLUTE_LIFETIME_HOURS` | `12` | |
| `SESSION_COOKIE_SECURE` | `true` | Required true when `NODE_ENV=production`. |
| `TRUST_PROXY` | `loopback` | Express `trust proxy`. In Docker, trust the compose network / reverse proxy hops. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated. Origin check uses this list. |

The web app calls the API through a same-origin proxy (`/api/v1/...` → `API_INTERNAL_BASE_URL`) so the session cookie stays first-party.

## 8. Production hardening (not in Phase 3)

1. **Non-superuser database role.** The compose user `hospital` is a superuser (Phase 2). A superuser can disable audit triggers and bypass future RLS. Create an application role with DML only, no `BYPASSRLS`, no trigger ownership.
2. **PostgreSQL RLS.** Session `SET app.tenant_id` (or equivalent) plus policies on tenant tables. Application filtering remains. Documented here because P3-D7 deferred RLS until the application user is not a superuser.
3. Reverse proxy / TLS termination and `TRUST_PROXY` matching the hop count.
4. Redis fail-open for login rate limits: if Redis is down, brute-force protection is only the account lockout. Monitor Redis.
5. TOTP MFA, Keycloak/OIDC, break-glass accounts, service accounts, clinical resource policies — later phases / still pending ADPs.

## 9. Known limitations

- Usernames are globally unique; a conflict on create reveals that the name exists. Login still uses a generic error.
- `CORS_ORIGINS` defaults to `localhost`, not `127.0.0.1`.
- Nested Prisma includes from global models are not tenant-filtered (§3).
- Redis rate limiting fails open (§2).
- The database superuser can disable audit triggers (§8).
- Permissions of not-yet-enabled modules exist in the registry but are always denied.

## 10. Tests

Security integration tests use a disposable `<POSTGRES_DB>_test` database (dropped and recreated each run) so they never create a platform administrator in the development database. That keeps `pnpm auth:bootstrap` usable on the local stack.
