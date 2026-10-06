import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import type { ApiSuccessResponse, Paginated, RoleAssignmentSummary, TenantUser } from '@hospital/types';
import { z } from 'zod';
import { paginationSchema, parseId, parseInput, uuidSchema } from '../../common/validation';
import { Principal, RequirePermission } from '../access-control/decorators';
import type { AuthPrincipal } from '../access-control/principal';
import { displayNameSchema, emailSchema, passwordInputSchema, usernameSchema } from '../identity/identity-schemas';
import { UsersService } from './users.service';

const listSchema = paginationSchema.extend({ search: z.string().trim().min(1).max(64).optional() }).strict();

const createSchema = z
  .object({
    username: usernameSchema,
    displayName: displayNameSchema,
    email: emailSchema.optional(),
    temporaryPassword: passwordInputSchema,
  })
  .strict();

const updateSchema = z
  .object({ displayName: displayNameSchema.optional(), email: emailSchema.nullable().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'at least one field is required');

const passwordResetSchema = z.object({ temporaryPassword: passwordInputSchema }).strict();

const assignRoleSchema = z
  .object({
    roleId: uuidSchema,
    departmentId: uuidSchema.optional(),
    validUntil: z.coerce.date().optional(),
  })
  .strict();

const departmentSchema = z.object({ departmentId: uuidSchema }).strict();

/** Hospital user administration. Tenant comes from the session; bodies with tenant ids are rejected. */
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequirePermission('user.read')
  @Get()
  async list(@Query() query: unknown): Promise<ApiSuccessResponse<Paginated<TenantUser>>> {
    return { success: true, data: await this.users.list(parseInput(listSchema, query)) };
  }

  @RequirePermission('user.create')
  @Post()
  async create(@Body() body: unknown): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.create(parseInput(createSchema, body)) };
  }

  @RequirePermission('user.read')
  @Get(':id')
  async get(@Param('id') id: string): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.get(parseId(id)) };
  }

  @RequirePermission('user.update')
  @Patch(':id')
  async update(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.updateProfile(principal, parseId(id), parseInput(updateSchema, body)) };
  }

  @RequirePermission('user.update')
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Principal() principal: AuthPrincipal, @Param('id') id: string): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.setMembershipStatus(principal, parseId(id), 'ACTIVE') };
  }

  @RequirePermission('user.disable')
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Principal() principal: AuthPrincipal, @Param('id') id: string): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.setMembershipStatus(principal, parseId(id), 'SUSPENDED') };
  }

  @RequirePermission('user.disable')
  @Post(':id/disable')
  @HttpCode(HttpStatus.OK)
  async disable(@Principal() principal: AuthPrincipal, @Param('id') id: string): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.setMembershipStatus(principal, parseId(id), 'DISABLED') };
  }

  @RequirePermission('user.password_reset')
  @Post(':id/password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Principal() principal: AuthPrincipal, @Param('id') id: string, @Body() body: unknown): Promise<void> {
    const { temporaryPassword } = parseInput(passwordResetSchema, body);
    await this.users.resetPassword(principal, parseId(id), temporaryPassword);
  }

  @RequirePermission('user.read', 'role.read')
  @Get(':id/roles')
  async roles(@Param('id') id: string): Promise<ApiSuccessResponse<RoleAssignmentSummary[]>> {
    return { success: true, data: await this.users.listRoles(parseId(id)) };
  }

  @RequirePermission('role.assign')
  @Post(':id/roles')
  async assignRole(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiSuccessResponse<RoleAssignmentSummary>> {
    return { success: true, data: await this.users.assignRole(principal, parseId(id), parseInput(assignRoleSchema, body)) };
  }

  @RequirePermission('role.assign')
  @Delete(':id/roles/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<void> {
    await this.users.removeRole(principal, parseId(id), parseId(assignmentId));
  }

  @RequirePermission('user.update')
  @Post(':id/departments')
  async addDepartment(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiSuccessResponse<TenantUser>> {
    const { departmentId } = parseInput(departmentSchema, body);
    return { success: true, data: await this.users.addDepartment(principal, parseId(id), departmentId) };
  }

  @RequirePermission('user.update')
  @Delete(':id/departments/:departmentId')
  async removeDepartment(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Param('departmentId') departmentId: string,
  ): Promise<ApiSuccessResponse<TenantUser>> {
    return { success: true, data: await this.users.removeDepartment(principal, parseId(id), parseId(departmentId)) };
  }
}
