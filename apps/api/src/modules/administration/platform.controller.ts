import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { ApiSuccessResponse, Paginated, PlatformHospital } from '@hospital/types';
import { z } from 'zod';
import { paginationSchema, parseId, parseInput, uuidSchema } from '../../common/validation';
import { Principal, RequirePermission } from '../access-control/decorators';
import type { AuthPrincipal } from '../access-control/principal';
import { displayNameSchema, emailSchema, passwordInputSchema, usernameSchema } from '../identity/identity-schemas';
import { PlatformService, type PlatformUser } from './platform.service';

const hospitalSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/, 'must be 2-32 characters: A-Z, 0-9, _ or -'),
    name: z.string().trim().min(1).max(200),
    type: z.enum(['GOVERNMENT', 'PRIVATE', 'NON_PROFIT']),
  })
  .strict();

const hospitalStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }).strict();

const administratorSchema = z
  .object({
    username: usernameSchema,
    displayName: displayNameSchema,
    email: emailSchema.optional(),
    temporaryPassword: passwordInputSchema,
  })
  .strict();

const membershipSchema = z.object({ userId: uuidSchema, tenantId: uuidSchema }).strict();

const listUsersSchema = paginationSchema.extend({ search: z.string().trim().min(1).max(64).optional() }).strict();

const passwordResetSchema = z.object({ temporaryPassword: passwordInputSchema }).strict();

const userStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']) }).strict();

/** Cross-tenant administration; only platform permissions (held by platform roles) reach it. */
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @RequirePermission('tenant.read')
  @Get('hospitals')
  async hospitals(): Promise<ApiSuccessResponse<PlatformHospital[]>> {
    return { success: true, data: await this.platform.listHospitals() };
  }

  @RequirePermission('tenant.create')
  @Post('hospitals')
  async createHospital(@Body() body: unknown): Promise<ApiSuccessResponse<PlatformHospital>> {
    return { success: true, data: await this.platform.createHospital(parseInput(hospitalSchema, body)) };
  }

  @RequirePermission('tenant.suspend')
  @Post('hospitals/:id/status')
  @HttpCode(HttpStatus.OK)
  async hospitalStatus(@Param('id') id: string, @Body() body: unknown): Promise<ApiSuccessResponse<PlatformHospital>> {
    const { status } = parseInput(hospitalStatusSchema, body);
    return { success: true, data: await this.platform.setHospitalStatus(parseId(id), status) };
  }

  @RequirePermission('tenant.admin.create')
  @Post('hospitals/:id/administrators')
  async createAdministrator(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiSuccessResponse<{ userId: string }>> {
    const input = parseInput(administratorSchema, body);
    return { success: true, data: await this.platform.createHospitalAdministrator(principal, parseId(id), input) };
  }

  @RequirePermission('tenant.membership.manage')
  @Post('memberships')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addMembership(@Body() body: unknown): Promise<void> {
    const { userId, tenantId } = parseInput(membershipSchema, body);
    await this.platform.addMembership(userId, tenantId);
  }

  @RequirePermission('platform.user.manage')
  @Get('users')
  async users(@Query() query: unknown): Promise<ApiSuccessResponse<Paginated<PlatformUser>>> {
    return { success: true, data: await this.platform.listUsers(parseInput(listUsersSchema, query)) };
  }

  @RequirePermission('platform.user.manage')
  @Post('users/:id/password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Principal() principal: AuthPrincipal, @Param('id') id: string, @Body() body: unknown): Promise<void> {
    const { temporaryPassword } = parseInput(passwordResetSchema, body);
    await this.platform.resetPassword(principal, parseId(id), temporaryPassword);
  }

  @RequirePermission('platform.user.manage')
  @Post('users/:id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async userStatus(@Principal() principal: AuthPrincipal, @Param('id') id: string, @Body() body: unknown): Promise<void> {
    const { status } = parseInput(userStatusSchema, body);
    await this.platform.setUserStatus(principal, parseId(id), status);
  }
}
