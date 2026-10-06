import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getRequestContext } from '../../common/request-context';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { redact } from './redact';

export type AuditCategory =
  | 'AUTH'
  | 'AUTHZ'
  | 'USER'
  | 'MEMBERSHIP'
  | 'ROLE'
  | 'DEPARTMENT'
  | 'TENANT'
  | 'SYSTEM';

export interface AuditEntry {
  action: string;
  category: AuditCategory;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  reason?: string;
  resourceType?: string;
  resourceId?: string;
  /** Defaults to the request's active tenant. `null` records a platform-level event. */
  tenantId?: string | null;
  /** Defaults to the authenticated user of the request. */
  actorUserId?: string | null;
  actorType?: 'USER' | 'SYSTEM' | 'ANONYMOUS';
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

/** Any Prisma client or transaction client. */
export interface AuditWriter {
  auditLog: { create(args: { data: Prisma.AuditLogUncheckedCreateInput }): Promise<unknown> };
}

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === undefined || value === null ? Prisma.DbNull : (redact(value) as Prisma.InputJsonValue);
}

/**
 * Append-only audit log (P3-D11). Pass the transaction client so the audit row commits or rolls
 * back together with the mutation it describes.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, writer: AuditWriter = this.prisma): Promise<void> {
    const context = getRequestContext();
    const actorUserId = entry.actorUserId === undefined ? (context?.userId ?? null) : entry.actorUserId;
    await writer.auditLog.create({
      data: {
        tenantId: entry.tenantId === undefined ? (context?.tenantId ?? null) : entry.tenantId,
        actorType: entry.actorType ?? (actorUserId ? 'USER' : 'ANONYMOUS'),
        actorUserId,
        action: entry.action,
        category: entry.category,
        result: entry.result ?? 'SUCCESS',
        reason: entry.reason ?? null,
        resourceType: entry.resourceType ?? null,
        resourceId: entry.resourceId ?? null,
        requestId: context?.requestId ?? null,
        sessionId: context?.sessionId ?? null,
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
        beforeData: toJson(entry.before),
        afterData: toJson(entry.after),
        metadata: toJson(entry.metadata),
      },
    });
  }

  /** For events with no surrounding mutation (denials, failed logins): never fails the request. */
  async recordSafely(entry: AuditEntry): Promise<void> {
    try {
      await this.record(entry);
    } catch (error) {
      this.logger.error(`Failed to write audit event ${entry.action}: ${(error as Error).name}`);
    }
  }
}
