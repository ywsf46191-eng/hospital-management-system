# Infrastructure — Local Development

**Document:** `docs/INFRASTRUCTURE_LOCAL_DEVELOPMENT.md`
**Phase:** 2 — Infrastructure Foundation
**Scope:** Local development environment only. This is **not** a production deployment guide
(see `DEPLOYMENT_INFRASTRUCTURE_ARCHITECTURE.md`).

---

## 1. Overview

| Service    | Image (pinned)                               | Purpose                         | Host access (loopback only)   |
| ---------- | -------------------------------------------- | ------------------------------- | ----------------------------- |
| postgres   | `postgres:17.6-alpine`                       | Primary relational database     | `127.0.0.1:5433`              |
| redis      | `redis:7.4.5-alpine`                         | Cache / future queues (BullMQ)  | `127.0.0.1:6379`              |
| minio      | `cgr.dev/chainguard/minio@sha256:4cf4831a…` (MinIO `RELEASE.2026-09-22T19-25-18Z`) — **temporary** | On-premise object storage | `127.0.0.1:9000` (S3 API), `127.0.0.1:9001` (console) |
| minio-init | `cgr.dev/chainguard/minio-client@sha256:3821d1d1…` (dev variant) — **temporary** | One-shot bucket/user setup | — |
| api        | built from `infrastructure/docker/api.Dockerfile` (profile `app`) | NestJS API | `127.0.0.1:4000` |
| web        | built from `infrastructure/docker/web.Dockerfile` (profile `app`) | Next.js web | `127.0.0.1:3000` |

PostgreSQL 17 is the approved major version. Changing it requires a documented architecture decision.

### MinIO image — temporary, not a production decision

MinIO remains the approved object storage. Official `minio/minio` and `minio/mc` images are no longer
published (Docker Hub repositories deleted in September 2026; Quay not reachable), so Phase 2 uses
Chainguard builds of MinIO **pinned by digest** for local development and testing only.

Before any production deployment, a final decision is required on the production MinIO image source,
licensing (MinIO community edition is AGPL-3.0 and archived) and deployment model.
See `ARCHITECTURE_DECISIONS_PENDING.md` (ADP-005).

### Networks

| Network               | Members                    | Purpose                                   |
| --------------------- | -------------------------- | ----------------------------------------- |
| `proxy-network`       | api, web                   | Entry point for a future reverse proxy    |
| `application-network` | api, web                   | web → api (server-side calls)             |
| `database-network`    | postgres, redis, api       | Data services reachable only by the api   |
| `storage-network`     | minio, minio-init, api     | Object storage reachable only by the api  |

### Security posture

- Data services publish ports on **127.0.0.1 only**; they are not reachable from the LAN or Internet.
- There are **no default passwords**. Compose refuses to start if a required secret is missing.
- Redis requires a password (`requirepass`).
- The MinIO bucket is private (`mc anonymous set none`).
- The API uses a **least-privilege MinIO account** (`MINIO_ACCESS_KEY`) limited to `MINIO_BUCKET`.
  The MinIO root account is used only by the `minio-init` job.
- Health output contains statuses, latencies and generic error codes only — never hosts or credentials.
- `.env` is git-ignored. Only `.env.example` (no secrets) is committed.

---

## 2. Prerequisites

- Docker Desktop (Windows: requires WSL 2) or Docker Engine with the Compose v2 plugin
- Node.js ≥ 22 and pnpm 9 (`packageManager` is pinned in the root `package.json`)

Check:

```bash
docker version
docker compose version
```

---

## 3. First-time setup

```bash
pnpm install
pnpm env:init          # creates .env with random local secrets (never overwrites an existing .env)
pnpm infra:config      # validates docker-compose.yml + .env
pnpm infra:up          # starts postgres, redis, minio (waits for healthy) and runs minio-init
pnpm db:generate       # generates Prisma Client
pnpm db:migrate:deploy # applies committed migrations
```

Then run the apps on the host:

```bash
pnpm dev:api           # http://localhost:4000/api/v1/health
pnpm dev:web           # http://localhost:3000/health
```

Or run everything in containers:

```bash
docker compose --profile app up -d --build
```

---

## 4. Environment variables

All variables are documented in `.env.example`. Key groups:

| Variable                                   | Used by           | Notes |
| ------------------------------------------ | ----------------- | ----- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | postgres  | Password required |
| `DATABASE_URL`                             | api, Prisma CLI   | Host form uses `127.0.0.1:5433`; the api container uses `postgres:5432` |
| `REDIS_PASSWORD`, `REDIS_URL`              | redis, api        | `redis://:<password>@host:6379/0` |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`   | minio, minio-init | Admin only — never given to the api |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` | api          | Container uses `minio:9000` |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`     | api, minio-init   | Least-privilege application account |
| `MINIO_BUCKET`                             | api, minio-init   | Private bucket name |
| `*_HOST_PORT`                              | compose           | Change if a port is already in use |
| `API_INTERNAL_BASE_URL`                    | web (server-side) | `http://api:4000/api/v1` inside Docker |

Passwords embedded in URLs must be URL-safe. `pnpm env:init` generates hex secrets.

Host URLs use `127.0.0.1`, not `localhost`: on Windows `localhost` resolves to IPv6 `::1` first,
while compose publishes ports on IPv4 loopback only, which adds a ~2 s delay to every new connection.

PostgreSQL is published on host port **5433** so it does not clash with a native PostgreSQL
service on 5432. Inside Docker the api always connects to `postgres:5432`.

The API validates its configuration at startup and reports only the **names** of invalid variables.

---

## 5. Health checks

| Endpoint                     | Meaning |
| ---------------------------- | ------- |
| `GET /api/v1/health/live`    | Liveness — the API process is serving HTTP (used by the container healthcheck) |
| `GET /api/v1/health`         | Readiness — application, PostgreSQL, Redis and object storage. HTTP 200 when `status: "ok"`, HTTP 503 when `status: "degraded"` |
| `http://localhost:3000/health` | Web page showing web status and each API component |

Example response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "Hospital System",
    "version": "0.1.0",
    "timestamp": "2026-10-02T10:00:00.000Z",
    "checks": {
      "application": { "status": "up", "latencyMs": 0 },
      "database": { "status": "up", "latencyMs": 4 },
      "redis": { "status": "up", "latencyMs": 2 },
      "objectStorage": { "status": "up", "latencyMs": 9 }
    }
  }
}
```

Failure error codes: `UNREACHABLE`, `TIMEOUT` (3 s per check), `CHECK_FAILED`.

Container-level healthchecks: `pg_isready` (postgres), `redis-cli ping` (redis), `mc ready local` (minio).

---

## 6. Day-to-day commands

| Task                         | Command |
| ---------------------------- | ------- |
| Start infrastructure         | `pnpm infra:up` |
| Show status                  | `pnpm infra:ps` |
| Follow logs                  | `pnpm infra:logs` |
| Stop (keeps data)            | `pnpm infra:down` |
| Restart                      | `pnpm infra:down` then `pnpm infra:up` (or `docker compose restart <service>`) |
| Migration status             | `pnpm db:migrate:status` |
| Unit tests                   | `pnpm test` |
| Connectivity tests           | `pnpm test:integration` (infrastructure must be running) |
| Full verification            | `pnpm verify` |

### Deleting data (development only)

```bash
pnpm infra:reset   # docker compose down --volumes --remove-orphans
```

This **permanently deletes** the local PostgreSQL, Redis and MinIO volumes. Never run it against an
environment that holds real data. After a reset, run `pnpm infra:up` and `pnpm db:migrate:deploy` again.

---

## 7. Migrations

- Schema: `prisma/schema.prisma` (shared). Migrations: `prisma/migrations/`.
- Phase 2 contains only a **baseline** migration that establishes migration history; no domain tables.
- Create migrations with `pnpm db:migrate:dev` (development database only); apply with `pnpm db:migrate:deploy`.
- Follow the migration rules in `CURSOR_MASTER_INSTRUCTIONS.md` §25 and §63 (review impact, test, document destructive operations).

---

## 8. Common problems

| Symptom | Cause / fix |
| ------- | ----------- |
| `docker: command not found` | Install Docker Desktop (Windows needs WSL 2) and restart the terminal. |
| `POSTGRES_PASSWORD is required` | `.env` is missing or incomplete — run `pnpm env:init`. |
| `port is already allocated` / bind error on 5433 | Another process uses the port. Set a free `POSTGRES_HOST_PORT` and update the port in `DATABASE_URL`. Same approach for 6379/9000/9001. Do not stop an unrelated native PostgreSQL service on 5432. |
| Authentication failed after `env:init -- -Force` | Volumes keep the password they were created with. Restore the old `.env` or run `pnpm infra:reset` (deletes local data). |
| Health shows `objectStorage: down (CHECK_FAILED)` | Bucket or application user missing — run `docker compose run --rm minio-init`. |
| `minio-init` fails with `/bin/sh^M` | The script was checked out with CRLF. `.gitattributes` forces LF; re-checkout `infrastructure/docker/minio/init-bucket.sh`. |
| Image pull / `pnpm install` timeouts | Network problem, not a code problem. Retry; pnpm reuses already-downloaded packages. |
| Prisma: `@prisma/client did not initialize yet` | Run `pnpm db:generate`. |
