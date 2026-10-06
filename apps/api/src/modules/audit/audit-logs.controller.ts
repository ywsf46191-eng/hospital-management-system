import { Controller, Get, Injectable, Param, Query } from '@nestjs/common';
import type { ApiSuccessResponse, AuditLogEntry, Paginated } from '@hospital/types';
import type { AuditLog, Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../common/errors';
import { paginationSchema, parseId, parseInput, uuidSchema } from '../../common/validation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RequirePermission } from '../access-control/decorators';
import { requireTenantId } from '../tenancy/tenant-prisma.service';

const querySchema = paginationSchema
  .extend({
    action: z.string().trim().regex(/^[A-Z_]{2,64}$/).optional(),
    category: z.string().trim().regex(/^[A-Z_]{2,32}$/).optional(),
    result: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
    actorUserId: uuidSchema.optional(),
  })
  .strict();

function toEntry(row: AuditLog): AuditLogEntry {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    tenantId: row.tenantId,
    actorType: row.actorType,
    actorUserId: row.actorUserId,
    action: row.action,
    category: row.category,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    result: row.result,
    reason: row.reason,
    requestId: row.requestId,
    ipAddress: row.ipAddress,
    metadata: row.metadata,
    beforeData: row.beforeData,
    afterData: row.afterData,
  };
}

/** Read-only access to the append-only audit log. Tenant users see only their hospital's events. */
@Injectable()
export class AuditLogQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string | null, rawQuery: unknown): Promise<Paginated<AuditLogEntry>> {
    const { page, pageSize, ...filters } = parseInput(querySchema, rawQuery);
    const where: Prisma.AuditLogWhereInput = { tenantId, ...filters };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items: rows.map(toEntry), page, pageSize, total };
  }

  async get(tenantId: string | null, id: string): Promise<AuditLogEntry> {
    const row = await this.prisma.auditLog.findFirst({ where: { id, tenantId } });
    if (!row) throw AppError.notFound('Audit entry');
    return toEntry(row);
  }
}

@Controller()
export class AuditLogsController {
  constructor(private readonly audit: AuditLogQueryService) {}

  @RequirePermission('audit.read')
  @Get('audit-logs')
  async list(@Query() query: unknown): Promise<ApiSuccessResponse<Paginated<AuditLogEntry>>> {
    return { success: true, data: await this.audit.list(requireTenantId(), query) };
  }

  @RequirePermission('audit.read')
  @Get('audit-logs/:id')
  async get(@Param('id') id: string): Promise<ApiSuccessResponse<AuditLogEntry>> {
    return { success: true, data: await this.audit.get(requireTenantId(), parseId(id)) };
  }

  /** Platform-level events (bootstrap, platform sign-ins, tenant management): `tenant_id IS NULL`. */
  @RequirePermission('platform.audit.read')
  @Get('platform/audit-logs')
  async platformList(@Query() query: unknown): Promise<ApiSuccessResponse<Paginated<AuditLogEntry>>> {
    return { success: true, data: await this.audit.list(null, query) };
  }
}
