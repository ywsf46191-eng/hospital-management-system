import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { ApiSuccessResponse, AuthMe, SessionSummary } from '@hospital/types';
import type { Response } from 'express';
import { z } from 'zod';
import { parseId, parseInput, uuidSchema } from '../../common/validation';
import { AllowPendingPasswordChange, Authenticated, Principal, Public } from '../access-control/decorators';
import type { AuthPrincipal } from '../access-control/principal';
import { AuthService } from './auth.service';
import { PASSWORD_MAX_LENGTH } from './password-policy';
import { SessionCookie } from './session-cookie';
import { deriveCsrfToken } from './session-token';

const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(64),
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  })
  .strict();

const selectTenantSchema = z.object({ tenantId: uuidSchema }).strict();

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    newPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  })
  .strict();

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: SessionCookie,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<{ csrfToken: string }>> {
    const { username, password } = parseInput(loginSchema, body);
    const session = await this.auth.login(username, password);
    this.cookie.set(response, session.token, session.absoluteExpiresAt);
    return { success: true, data: { csrfToken: deriveCsrfToken(session.token) } };
  }

  @Authenticated()
  @AllowPendingPasswordChange()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Principal() principal: AuthPrincipal, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.auth.logout(principal);
    this.cookie.clear(response);
  }

  @Authenticated()
  @AllowPendingPasswordChange()
  @Get('me')
  async me(@Principal() principal: AuthPrincipal): Promise<ApiSuccessResponse<AuthMe>> {
    return { success: true, data: await this.auth.me(principal) };
  }

  @Authenticated()
  @Post('tenant')
  @HttpCode(HttpStatus.OK)
  async selectTenant(
    @Principal() principal: AuthPrincipal,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<{ csrfToken: string }>> {
    const { tenantId } = parseInput(selectTenantSchema, body);
    const token = await this.auth.selectTenant(principal, tenantId);
    this.cookie.set(response, token, principal.session.absoluteExpiresAt);
    return { success: true, data: { csrfToken: deriveCsrfToken(token) } };
  }

  @Authenticated()
  @AllowPendingPasswordChange()
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Principal() principal: AuthPrincipal,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<{ csrfToken: string }>> {
    const { currentPassword, newPassword } = parseInput(changePasswordSchema, body);
    const token = await this.auth.changePassword(principal, currentPassword, newPassword);
    this.cookie.set(response, token, principal.session.absoluteExpiresAt);
    return { success: true, data: { csrfToken: deriveCsrfToken(token) } };
  }

  @Authenticated()
  @Get('sessions')
  async sessions(@Principal() principal: AuthPrincipal): Promise<ApiSuccessResponse<SessionSummary[]>> {
    return { success: true, data: await this.auth.listSessions(principal) };
  }

  @Authenticated()
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const wasCurrent = await this.auth.revokeOwnSession(principal, parseId(id));
    if (wasCurrent) this.cookie.clear(response);
  }
}
