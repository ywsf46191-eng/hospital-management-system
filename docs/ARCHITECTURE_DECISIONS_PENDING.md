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
| **Blocking for** | Phase 24 — Reporting |

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
| **Status** | `PENDING DECISION` |
| **Discovered** | Phase 0 repository inspection |
| **Blocking for** | Phase 4 — Authentication |

### Problem

- `CURSOR_MASTER_INSTRUCTIONS.md` prefers **Keycloak** (or approved auth architecture).
- `DATABASE_SCHEMA.md` suggests local fields such as `password_hash` on users.

These approaches are compatible only if local fields are identity-provider metadata/cache — or if local auth is chosen instead of Keycloak. The authoritative Phase 4 approach is not finalized.

### Options (for later decision)

1. Keycloak (or another IdP) as primary identity; app users map to IdP subjects.
2. Local authentication for MVP, with IdP-ready interfaces for later migration.
3. Hybrid: local for on-prem isolated hospitals; Keycloak for cloud/central deployments.

### Decision

`PENDING DECISION`  
**Do not implement Authentication/Keycloak in Phase 0/1.**

---

## 4. Tenant Field Naming (`tenant_id` vs `hospital_id`)

| Field | Value |
|-------|-------|
| **ID** | ADP-004 |
| **Status** | `PENDING DECISION` |
| **Discovered** | Phase 0 repository inspection |
| **Blocking for** | Phase 5–6 (Authorization / Hospital tenant) and Prisma domain models |

### Problem

Documentation mentions both `tenant_id` and `hospital_id` as acceptable relations for tenant-owned records. The hospital is the primary tenant boundary; the Prisma field naming convention must be unified before domain schema work.

### Options (for later decision)

1. Use `hospitalId` everywhere (domain-aligned naming).
2. Use `tenantId` everywhere (generic multi-tenant naming) with Hospital as the tenant entity.
3. Use `tenantId` in shared infra tables and `hospitalId` only where hospital is a business FK distinct from tenancy (only if a real dual concept appears — currently hospital **is** the tenant).

### Decision

`PENDING DECISION`  
**Do not build full domain schema until decided.** Phase 1 Prisma file remains a minimal placeholder only.

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

## Change Control

When a decision is made:

1. Update the item status from `PENDING DECISION` to `DECIDED`.
2. Record the decision, date, and rationale.
3. Update affected docs under `docs/`.
4. Then implement in the relevant phase — not before.
