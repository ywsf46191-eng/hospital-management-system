import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import type { ApiSuccessResponse, PermissionSummary, RoleSummary } from '@hospital/types';
import { z } from 'zod';
import { parseId, parseInput } from '../../common/validation';
import { Principal, RequirePermission } from '../access-control/decorators';
import { PERMISSION_KEY_PATTERN } from '../access-control/permission-registry';
import type { AuthPrincipal } from '../access-control/principal';
import { RolesService, TENANT_ROLE_SCOPES } from './roles.service';

const createSchema = z
  .object({
    key: z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,63}$/, 'must be 3-64 characters: A-Z, 0-9 or underscore'),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'at least one field is required');

const permissionKeySchema = z.string().max(128).regex(PERMISSION_KEY_PATTERN);

const grantSchema = z
  .object({ permission: permissionKeySchema, scope: z.enum(TENANT_ROLE_SCOPES).default('HOSPITAL') })
  .strict();

@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermission('permission.read')
  @Get('permissions')
  permissions(): ApiSuccessResponse<PermissionSummary[]> {
    return { success: true, data: this.roles.listPermissions() };
  }

  @RequirePermission('role.read')
  @Get('roles')
  async list(): Promise<ApiSuccessResponse<RoleSummary[]>> {
    return { success: true, data: await this.roles.list() };
  }

  @RequirePermission('role.create')
  @Post('roles')
  async create(@Body() body: unknown): Promise<ApiSuccessResponse<RoleSummary>> {
    return { success: true, data: await this.roles.create(parseInput(createSchema, body)) };
  }

  @RequirePermission('role.read')
  @Get('roles/:id')
  async get(@Param('id') id: string): Promise<ApiSuccessResponse<RoleSummary>> {
    return { success: true, data: await this.roles.get(parseId(id)) };
  }

  @RequirePermission('role.update')
  @Patch('roles/:id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<ApiSuccessResponse<RoleSummary>> {
    return { success: true, data: await this.roles.update(parseId(id), parseInput(updateSchema, body)) };
  }

  @RequirePermission('role.update')
  @Post('roles/:id/permissions')
  async grant(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiSuccessResponse<RoleSummary>> {
    return { success: true, data: await this.roles.grantPermission(principal, parseId(id), parseInput(grantSchema, body)) };
  }

  @RequirePermission('role.update')
  @Delete('roles/:id/permissions/:permission')
  async revoke(
    @Principal() principal: AuthPrincipal,
    @Param('id') id: string,
    @Param('permission') permission: string,
  ): Promise<ApiSuccessResponse<RoleSummary>> {
    const key = parseInput(permissionKeySchema, permission);
    return { success: true, data: await this.roles.revokePermission(principal, parseId(id), key) };
  }
}
