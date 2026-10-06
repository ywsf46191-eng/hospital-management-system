import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppError } from '../../common/errors';
import { getRequestContext } from '../../common/request-context';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/** Models whose rows belong to exactly one tenant (`tenant_id NOT NULL`). */
const TENANT_MODELS = new Set(['Department', 'UserHospitalMembership', 'UserDepartment', 'RoleAssignment']);
/** Tenant roles plus read-only system templates (`tenant_id IS NULL`). */
const TENANT_OR_TEMPLATE_MODELS = new Set(['Role']);

const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);
const WHERE_OPERATIONS = new Set([...READ_OPERATIONS, 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']);
const CREATE_OPERATIONS = new Set(['create', 'createMany', 'createManyAndReturn']);

type Args = Record<string, unknown>;

export class TenantIsolationError extends AppError {
  constructor(message: string) {
    super('TENANT_ACCESS_DENIED', HttpStatus.FORBIDDEN, message);
  }
}

export function requireTenantId(): string {
  const tenantId = getRequestContext()?.tenantId;
  if (!tenantId) {
    throw new AppError('TENANT_CONTEXT_REQUIRED', HttpStatus.FORBIDDEN, 'An active hospital must be selected.');
  }
  return tenantId;
}

function withFilter(where: unknown, filter: Args): Args {
  const base = (where ?? {}) as Args;
  const existing = base.AND;
  const and = existing === undefined ? [] : Array.isArray(existing) ? existing : [existing];
  return { ...base, AND: [...and, filter] };
}

function stampTenant(data: unknown, tenantId: string): Args {
  const record = { ...((data ?? {}) as Args) };
  if ('hospital' in record) {
    throw new TenantIsolationError('Tenant-scoped writes must not set the hospital relation directly.');
  }
  if (record.tenantId !== undefined && record.tenantId !== tenantId) {
    throw new TenantIsolationError('Cross-tenant write rejected.');
  }
  record.tenantId = tenantId;
  return record;
}

function assertNoTenantChange(data: unknown, tenantId: string): void {
  const record = (data ?? {}) as Args;
  if ('hospital' in record || (record.tenantId !== undefined && record.tenantId !== tenantId)) {
    throw new TenantIsolationError('Changing the tenant of a record is not allowed.');
  }
}

/**
 * Applies the active tenant (from the server-side session, via RequestContext) to every query on
 * tenant-owned models. Fails closed when no tenant is active.
 *
 * Limitation: relations loaded with `include`/`select` from a non-tenant root model (e.g. User)
 * are not filtered. Tenant data must be queried from a tenant-scoped root model.
 */
export function scopeTenantQuery(model: string, operation: string, args: Args, tenantId: string): Args {
  const templatesVisible = TENANT_OR_TEMPLATE_MODELS.has(model) && READ_OPERATIONS.has(operation);
  const filter: Args = templatesVisible ? { OR: [{ tenantId }, { tenantId: null }] } : { tenantId };
  const next: Args = { ...args };

  if (WHERE_OPERATIONS.has(operation)) {
    next.where = withFilter(args.where, filter);
  }
  if (operation === 'update' || operation === 'updateMany') {
    assertNoTenantChange(args.data, tenantId);
  }
  if (operation === 'upsert') {
    next.create = stampTenant(args.create, tenantId);
    assertNoTenantChange(args.update, tenantId);
  }
  if (CREATE_OPERATIONS.has(operation)) {
    next.data = Array.isArray(args.data)
      ? args.data.map((item) => stampTenant(item, tenantId))
      : stampTenant(args.data, tenantId);
  }
  return next;
}

function createTenantClient(prisma: PrismaService) {
  return prisma.$extends(
    Prisma.defineExtension({
      name: 'tenant-isolation',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!TENANT_MODELS.has(model) && !TENANT_OR_TEMPLATE_MODELS.has(model)) {
              return query(args);
            }
            return query(scopeTenantQuery(model, operation, args as Args, requireTenantId()) as typeof args);
          },
        },
      },
    }),
  );
}

export type TenantClient = ReturnType<typeof createTenantClient>;

/** Prisma client for tenant-owned data. Domain services must use this, not PrismaService. */
@Injectable()
export class TenantPrismaService {
  readonly client: TenantClient;

  constructor(prisma: PrismaService) {
    this.client = createTenantClient(prisma);
  }
}
