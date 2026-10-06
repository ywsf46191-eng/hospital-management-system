# Architecture Decisions Pending

**Document:** `docs/ARCHITECTURE_DECISIONS_PENDING.md`  
**Status:** Living decision log  
**Created during:** Phase 0 + Phase 1 foundation

This file records architectural questions discovered during repository inspection that must **not** be solved by silent redesign. Each item remains pending until an explicit product/owner decision is made.

Do **not** change Modular Monolith, Multi-Tenancy, Offline-First, On-Prem + Cloud, Event-Based Sync, PostgreSQL, Prisma, Next.js, or NestJS while resolving these items.

---

## 1. Reporting Analytics Specification Content

| Field | Value |
|-------|-------|
| **ID** | ADP-001 |
| **Status** | `PENDING DECISION` |
| **Discovered** | Phase 0 repository inspection |
| **Blocking for** | Phase 23 — Reporting (roadmap renumbered 2026-10-06) |

### Problem

The file originally labeled `REPORTING_ANALYTICS_SPEC` contains the **same content** as `NOTIFICATION_COMMUNICATION_SPEC` (identical document body / hash). The reporting and analytics specification is therefore **missing**.

### Options (for later decision)

1. Author a new authoritative `REPORTING_ANALYTICS_SPEC.md` from product requirements.
2. Recover the intended reporting document from another source if available.
3. Derive an interim reporting spec from `MODULES.md` + dashboards sections, then replace when complete.

### Decision

`PENDING DECISION`

---

## 2. Documentation File Naming Consistency

| Field | Value |
|-------|-------|
| **ID** | ADP-002 |
| **Status** | `PENDING DECISION` |
| **Discovered** | Phase 0 repository inspection |
| **Blocking for** | Documentation hygiene (non-blocking for early phases) |

### Problem

`HOSPITAL_SYSTEM_MASTER_SPEC.md` §40 lists shorter document names such as:

- `ARCHITECTURE.md`
- `SYNC_ARCHITECTURE.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `BACKUP_AND_DR.md`
- `NETWORK_ARCHITECTURE.md`
- `TESTING.md`

The repository currently uses longer authoritative names, for example:

- `SECURITY_ARCHITECTURE.md`
- `DEPLOYMENT_INFRASTRUCTURE_ARCHITECTURE.md`
- `API_INTEGRATION_ARCHITECTURE.md`
- `TESTING_QA_SPECIFICATION.md`

Content coverage largely exists under the longer names; naming/split is inconsistent.

### Options (for later decision)

1. Keep current long names and update Master Spec §40 to match.
2. Add short-name aliases that point to the long-form documents.
3. Rename/split documents to match Master Spec §40 exactly.

### Decision

`PENDING DECISION`

---

## 3. Authentication Strategy (Keycloak vs Local Auth)

| Field | Value |
|-------|-------|
| **ID** | ADP-003 |
| **Status** | `DECIDED` (2026-10-06) |
| **Discovered** | Phase 0 repository inspection |
| **Blocking for** | Phase 3 — Authentication & Authorization |

### Problem

- `CURSOR_MASTER_INSTRUCTIONS.md` prefers **Keycloak** (or approved auth architecture).
- `DATABASE_SCHEMA.md` suggests local fields such as `password_hash` on users.

These approaches are compatible only if local fields are identity-provider metadata/cache — or if local auth is chosen instead of Keycloak.

### Options (for later decision)

1. Keycloak (or another IdP) as primary identity; app users map to IdP subjects.
2. Local authentication for MVP, with IdP-ready interfaces for later migration.
3. Hybrid: local for on-prem isolated hospitals; Keycloak for cloud/central deployments.

### Decision

`DECIDED` — **Option 2: application-managed authentication** (Argon2id password hashing) behind an
`IdentityProvider` abstraction. Business modules depend only on the internal user id, sessions and
permissions, so a future Keycloak/OIDC provider can replace the local provider without redesign.
Keycloak is **not** installed or implemented in Phase 3. Password fields live in a dedicated
`user_credentials` table owned by the local provider. See `AUTHENTICATION_AUTHORIZATION.md`.

---

## 4. Tenant Field Naming (`tenant_id` vs `hospital_id`)

| Field | Value |
|-------|-------|
| **ID** | ADP-004 |
| **Status** | `DECIDED` (2026-10-06) |
| **Discovered** | Phase 0 repository inspection |
| **Blocking for** | Phase 3 (Authentication & Authorization) and Prisma domain models |

### Problem

Documentation mentions both `tenant_id` and `hospital_id` as acceptable relations for tenant-owned records. The hospital is the primary tenant boundary; the Prisma field naming convention must be unified before domain schema work.

### Options (for later decision)

1. Use `hospitalId` everywhere (domain-aligned naming).
2. Use `tenantId` everywhere (generic multi-tenant naming) with Hospital as the tenant entity.
3. Use `tenantId` in shared infra tables and `hospitalId` only where hospital is a business FK distinct from tenancy (only if a real dual concept appears — currently hospital **is** the tenant).

### Decision

`DECIDED` — **Option 2: `tenant_id` everywhere.** A Hospital represents the tenant in the current
product model. Tenant-owned tables use the column `tenant_id` (Prisma field `tenantId`) referencing
`hospitals.id`. `hospital_id` / `hospitalId` must not be used as an interchangeable tenant identifier.

---

## 5. MinIO Container Image Availability

| Field | Value |
|-------|-------|
| **ID** | ADP-005 |
| **Status** | `PENDING DECISION` |
| **Discovered** | Phase 2 verification (2026-10-06) |
| **Blocking for** | Phase 2 — Infrastructure Foundation (object storage connectivity) |

### Problem

MinIO is the approved on-premise object storage, but no official container image can be pulled:

- `minio/minio` and `minio/mc` were deleted from Docker Hub (September 2026).
- `quay.io/minio/minio` and `quay.io/minio/mc` return "no such manifest" / HTTP 401 from this machine.
- The MinIO community edition repository was archived (April 2026) and is distributed as source only;
  the community edition no longer receives security fixes.

PostgreSQL and Redis are unaffected and verified. The API is decoupled from MinIO through the
`ObjectStorage` port, and the adapter uses the S3-compatible MinIO SDK.

### Options (for later decision)

1. **Build MinIO from the archived source** into a project-owned image (AGPL-3.0, unmaintained, no security fixes).
2. **Third-party MinIO image** (available now: `cgr.dev/chainguard/minio`, `bitnamilegacy/minio`) — adds a vendor
   trust dependency; `bitnamilegacy` is itself frozen.
3. **Replace MinIO with another S3-compatible object store** (e.g. SeaweedFS, Garage) behind the existing
   `ObjectStorage` port — changes an approved stack component and requires explicit approval.

### Interim measure (approved 2026-10-06, Phase 2 only)

- MinIO remains the official object storage in the architecture.
- Local development and Phase 2 verification use Chainguard MinIO images pinned by digest:
  - server: `cgr.dev/chainguard/minio@sha256:4cf4831a2bbcf13ddca09c1cbcc9faff716dd3c4247e0babc32864b8ee8e0034`
    (MinIO `RELEASE.2026-09-22T19-25-18Z`)
  - client: `cgr.dev/chainguard/minio-client@sha256:3821d1d13eeed245d780432596c41e5a8632aef6ea61f841e3da870c2518db01`
- This is **not** a production decision. Building MinIO from source and replacing MinIO
  (Garage, SeaweedFS) were explicitly not chosen.

### Decision

`PENDING DECISION` — production MinIO image source, licensing and deployment model must be decided
before production.

---

## 6. Phase 3 Decisions (Authentication & Authorization)

| Field | Value |
|-------|-------|
| **ID** | ADP-006 |
| **Status** | `DECIDED` (2026-10-06) |
| **Scope** | Phase 3 — Authentication & Authorization |

| Ref | Decision |
|-----|----------|
| P3-D0 | Authentication + Authorization are implemented together as **Phase 3**. The roadmap was renumbered (Design System is now Phase 4; Hospital/Tenant Management Phase 5; later phases shift by one). Only minimal authentication/administration UI; the full Design System is deferred. |
| P3-D1 | Application-managed authentication with Argon2id behind an `IdentityProvider` interface (ADP-003). No Keycloak in this phase. |
| P3-D2 | `tenant_id` everywhere; Hospital = tenant (ADP-004). |
| P3-D3 | `UserHospitalMembership`: a user may belong to one or more hospitals. The active tenant is selected from the user's own active memberships and stored in the server-side session; the client never defines tenant context. `User` and `Staff` remain separate; Staff is not implemented. |
| P3-D4 | Opaque server-side sessions stored in PostgreSQL (only a SHA-256 hash of the token). Secure + HttpOnly + SameSite cookies, idle timeout, absolute expiry, revocation, session management, CSRF protection. Redis is used only for login rate limiting. |
| P3-D5 | Permission naming `<resource>.<action>` with `read` (e.g. `patient.read`). The `<module>.<resource>.<action>` scheme in `ROLES_PERMISSIONS_MATRIX.md` §4 is superseded. |
| P3-D6 | Complete permission registry defined in code and synchronized into PostgreSQL. Roles are data-driven; system roles are read-only templates that never bypass tenant isolation. Authorization uses `PermissionService.can()` — never role-name checks. Seeded role templates follow `RBAC.md` §7. |
| P3-D7 | Application-layer tenant isolation with automatic Prisma tenant filtering. PostgreSQL RLS is deferred: the current application database user is a superuser (superusers bypass RLS). **RLS + a non-superuser application role is a production-hardening requirement.** |
| P3-D8 | MFA-ready interfaces/configuration only (no TOTP). No self-service email password reset (Notifications is a later phase); admin-initiated password reset only. Minimal Hospital and Department entities. Break-glass access is not implemented. Module activation is not implemented: only core modules (`platform`, `system`, `administration`, `identity`, `audit`) are enabled; permissions of all other modules are denied until module activation exists. |
| P3-D9 | `pnpm auth:bootstrap` creates the first platform administrator: interactive password entry only, refuses when an active platform administrator exists, forces a password change on first login, audited. |
| P3-D10 | Defaults: password min 12, lockout after 5 failures for 15 minutes, idle timeout 30 minutes, absolute lifetime 12 hours, login rate limiting per IP and per username. All configurable via environment. |
| P3-D11 | Append-only `audit_logs`; UPDATE/DELETE/TRUNCATE rejected by database triggers; no passwords/tokens/secrets; permission denials recorded; written in the same transaction as the mutation. |
| P3-D12 | New dependencies limited to Argon2id hashing and Helmet. |

### Still pending (not resolved by Phase 3)

- Production MinIO image/licensing (ADP-005), reporting spec (ADP-001), doc naming (ADP-002).
- Break-glass access, department/ward/assigned-patient resource policies for clinical modules,
  service accounts (`SYNC_SERVICE`, devices), MFA (TOTP) — later phases.
- Reverse proxy (Nginx/Traefik) listed in the Phase 2 roadmap section is not yet deployed.

---

## 7. Phase 4 Decisions (Design System)

| Field | Value |
|-------|-------|
| **ID** | ADP-007 |
| **Status** | `DECIDED` (2026-10-06) |
| **Scope** | Phase 4 — Design System |

Numbering is **not** changed: Design System remains Phase 4; Hospital/Tenant Management remains Phase 5.

| Ref | Decision |
|-----|----------|
| P4-D0 | Next implementation phase is **Phase 4 — Design System**. Keep the current roadmap numbering exactly as documented after P3-D0. |
| P4-D1 | UI kit is **shadcn/ui + Tailwind CSS + Lucide**. Tokens are restrained and institutional (navy / white / gray, semantic status colors). No decorative shadcn/marketing defaults (no gradients, glass, neon, or unnecessary animation). |
| P4-D2 | Locale is a **cookie plus in-memory state** (`en` / `ar`). Persisted user language and hospital language defaults are **deferred to Phase 5**. |
| P4-D3 | **Self-host** Inter and Noto Sans Arabic in the repository. No Google Fonts and no font CDN at runtime. |
| P4-D4 | **Restyle all existing Phase 3 pages** onto the design system. Do not change authentication, authorization, CSRF, tenant, or health-page contracts. |
| P4-D5 | Navigation shows **only implemented routes** the current user is permitted to access. No placeholders or dead links for future modules. |
| P4-D6 | **One shared institutional theme**. Tenant-specific branding, logos, and configurable colors are **Phase 5**. |

### Deferred to Phase 5 (explicit)

- Hospital settings, branding, `uiProfile`, timezone, currency, number formats, module activation.
- Persisted `users.locale` / hospital default language.
- Dark mode (not a government-deployment priority).

---

## Change Control

When a decision is made:

1. Update the item status from `PENDING DECISION` to `DECIDED`.
2. Record the decision, date, and rationale.
3. Update affected docs under `docs/`.
4. Then implement in the relevant phase — not before.
