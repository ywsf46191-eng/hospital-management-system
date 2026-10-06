import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { generateSessionToken, hashSessionToken, SESSION_TOKEN_PATTERN } from './session-token';

/** Avoids a database write on every request; idle expiry precision is therefore ±1 minute. */
const TOUCH_INTERVAL_MS = 60_000;

export interface ActiveSession {
  id: string;
  userId: string;
  tenantId: string | null;
  createdAt: Date;
  absoluteExpiresAt: Date;
  idleExpiresAt: Date;
  passwordChangeRequired: boolean;
  user: { id: string; username: string; displayName: string };
}

export type SessionValidation =
  | { status: 'valid'; session: ActiveSession }
  | { status: 'expired' }
  | { status: 'invalid' };

export type RevokeReason =
  | 'LOGOUT'
  | 'USER_REVOKED'
  | 'EXPIRED_IDLE'
  | 'EXPIRED_ABSOLUTE'
  | 'USER_INACTIVE'
  | 'MEMBERSHIP_INACTIVE'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'ADMIN_ACTION';

/** Any Prisma client or transaction client, including tenant-extended ones. */
export interface SessionWriter {
  session: {
    create(args: Prisma.SessionCreateArgs): Promise<{ id: string }>;
    updateMany(args: Prisma.SessionUpdateManyArgs): Promise<{ count: number }>;
  };
}

/** Opaque server-side sessions stored in PostgreSQL (P3-D4). PostgreSQL is authoritative. */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async create(
    input: { userId: string; tenantId: string | null; ipAddress: string | null; userAgent: string | null },
    tx: SessionWriter = this.prisma,
  ): Promise<{ token: string; sessionId: string; absoluteExpiresAt: Date }> {
    const token = generateSessionToken();
    const now = Date.now();
    const absoluteExpiresAt = new Date(now + this.config.session.absoluteLifetimeMs);
    const idleExpiresAt = new Date(Math.min(now + this.config.session.idleTimeoutMs, absoluteExpiresAt.getTime()));
    const session = await tx.session.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        tokenHash: hashSessionToken(token),
        idleExpiresAt,
        absoluteExpiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
      select: { id: true },
    });
    return { token, sessionId: session.id, absoluteExpiresAt };
  }

  async validate(token: string | undefined): Promise<SessionValidation> {
    if (!token || !SESSION_TOKEN_PATTERN.test(token)) return { status: 'invalid' };
    const row = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            status: true,
            credential: { select: { mustChange: true } },
          },
        },
      },
    });
    if (!row || row.revokedAt) return { status: 'invalid' };

    const now = new Date();
    if (now >= row.absoluteExpiresAt) {
      await this.revoke(row.id, 'EXPIRED_ABSOLUTE');
      return { status: 'expired' };
    }
    if (now >= row.idleExpiresAt) {
      await this.revoke(row.id, 'EXPIRED_IDLE');
      return { status: 'expired' };
    }
    if (row.user.status !== 'ACTIVE') {
      await this.revoke(row.id, 'USER_INACTIVE');
      return { status: 'invalid' };
    }
    if (row.tenantId) {
      const membership = await this.prisma.userHospitalMembership.findUnique({
        where: { tenantId_userId: { tenantId: row.tenantId, userId: row.userId } },
        select: { status: true, hospital: { select: { status: true } } },
      });
      if (membership?.status !== 'ACTIVE' || membership.hospital.status !== 'ACTIVE') {
        await this.revoke(row.id, 'MEMBERSHIP_INACTIVE');
        return { status: 'invalid' };
      }
    }

    let idleExpiresAt = row.idleExpiresAt;
    if (now.getTime() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
      idleExpiresAt = new Date(
        Math.min(now.getTime() + this.config.session.idleTimeoutMs, row.absoluteExpiresAt.getTime()),
      );
      await this.prisma.session.update({ where: { id: row.id }, data: { lastSeenAt: now, idleExpiresAt } });
    }

    return {
      status: 'valid',
      session: {
        id: row.id,
        userId: row.userId,
        tenantId: row.tenantId,
        createdAt: row.createdAt,
        absoluteExpiresAt: row.absoluteExpiresAt,
        idleExpiresAt,
        passwordChangeRequired: row.user.credential?.mustChange ?? false,
        user: { id: row.user.id, username: row.user.username, displayName: row.user.displayName },
      },
    };
  }

  /** Issues a new token for an existing session (privilege/context change; prevents fixation). */
  async rotate(sessionId: string, changes: { tenantId?: string | null } = {}): Promise<string> {
    const token = generateSessionToken();
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { tokenHash: hashSessionToken(token), ...changes },
    });
    return token;
  }

  async revoke(sessionId: string, reason: RevokeReason, tx: SessionWriter = this.prisma): Promise<void> {
    await tx.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  async revokeAllForUser(
    userId: string,
    reason: RevokeReason,
    options: { exceptSessionId?: string; tenantId?: string } = {},
    tx: SessionWriter = this.prisma,
  ): Promise<number> {
    const result = await tx.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(options.tenantId ? { tenantId: options.tenantId } : {}),
        ...(options.exceptSessionId ? { id: { not: options.exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
    return result.count;
  }

  listActive(userId: string) {
    const now = new Date();
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, absoluteExpiresAt: { gt: now }, idleExpiresAt: { gt: now } },
      select: {
        id: true,
        tenantId: true,
        createdAt: true,
        lastSeenAt: true,
        idleExpiresAt: true,
        absoluteExpiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: { lastSeenAt: 'desc' },
    });
  }
}
