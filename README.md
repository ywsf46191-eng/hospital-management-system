# Hospital Management System

Modular, multi-tenant Hospital Information System (HIS/HMS) designed for government, private, and non-profit hospitals.

## Architecture (authoritative)

- Modular monolith
- Multi-tenant (hospital = tenant boundary)
- On-premise + cloud (hybrid)
- Offline-first local hospital operation
- Event-based synchronization
- PostgreSQL + Prisma
- Next.js (web) + NestJS (API)

**Source of truth for specifications:** [`docs/`](./docs/)

Start with:

- [`docs/CURSOR_MASTER_INSTRUCTIONS.md`](./docs/CURSOR_MASTER_INSTRUCTIONS.md)
- [`docs/HOSPITAL_SYSTEM_MASTER_SPEC.md`](./docs/HOSPITAL_SYSTEM_MASTER_SPEC.md)
- [`docs/IMPLEMENTATION_ROADMAP.md`](./docs/IMPLEMENTATION_ROADMAP.md)
- [`docs/ARCHITECTURE_DECISIONS_PENDING.md`](./docs/ARCHITECTURE_DECISIONS_PENDING.md)

Original Word exports are preserved under `وثيقة المستشفى الكاملة/` and are **not** the active source of truth.

## Repository layout

```text
apps/web          Next.js frontend
apps/api          NestJS API
packages/ui       Shared UI primitives
packages/types    Shared TypeScript types
packages/validation Shared validation schemas
packages/config   Shared configuration helpers
prisma            Prisma schema & migrations
infrastructure    Docker / nginx / monitoring / deployment scaffolds
docs              Authoritative specifications
tests             Cross-cutting tests
scripts           Utility scripts
```

## Prerequisites

- Node.js >= 20
- pnpm 9.x (`packageManager` is pinned in root `package.json`)

## Quick start (Phase 0 + Phase 1 foundation)

```bash
pnpm install
cp .env.example .env

pnpm --filter @hospital/api dev
pnpm --filter @hospital/web dev
```

- API health: `http://localhost:4000/api/v1/health`
- Web health: `http://localhost:3000/health`

## Common scripts

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm build:web
pnpm build:api
```

## Foundation verification

Runs install, lint, typecheck, builds, API/web health checks, and the Git secrets check:

```bash
pnpm verify
```

## Current milestone

Phase 0 (repository initialization) + Phase 1 (monorepo foundation) only.

Status: files created, **validation pending** (dependency install not yet completed).

- No authentication / Keycloak yet
- No patient / appointment / clinical modules yet
- No production PostgreSQL / Redis / MinIO configuration yet (structural placeholders only)

## License

Proprietary — all rights reserved unless otherwise stated.
