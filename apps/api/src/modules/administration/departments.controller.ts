import { Body, Controller, Get, HttpCode, HttpStatus, Injectable, Param, Patch, Post } from '@nestjs/common';
import type { ApiSuccessResponse, DepartmentSummary } from '@hospital/types';
import { z } from 'zod';
import { AppError } from '../../common/errors';
import { parseId, parseInput } from '../../common/validation';
import { RequirePermission } from '../access-control/decorators';
import { AuditService } from '../audit/audit.service';
import { requireTenantId, TenantPrismaService } from '../tenancy/tenant-prisma.service';

const departmentSelect = { id: true, code: true, name: true, status: true } as const;

const createSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/, 'must be 2-32 characters: A-Z, 0-9, _ or -'),
    name: z.string().trim().min(1).max(120),
  })
  .strict();

const updateSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly audit: AuditService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  list(): Promise<DepartmentSummary[]> {
    return this.db.department.findMany({ select: departmentSelect, orderBy: { code: 'asc' } });
  }

  create(input: { code: string; name: string }): Promise<DepartmentSummary> {
    return this.db.$transaction(async (tx) => {
      const department = await tx.department.create({ data: { tenantId: requireTenantId(), ...input }, select: departmentSelect });
      await this.audit.record(
        { action: 'DEPARTMENT_CREATED', category: 'DEPARTMENT', resourceType: 'department', resourceId: department.id, after: input },
        tx,
      );
      return department;
    });
  }

  async update(id: string, data: { name?: string; status?: 'DISABLED' }, action: string): Promise<DepartmentSummary> {
    const existing = await this.db.department.findFirst({ where: { id }, select: departmentSelect });
    if (!existing) throw AppError.notFound('Department');
    return this.db.$transaction(async (tx) => {
      const department = await tx.department.update({ where: { id }, data, select: departmentSelect });
      await this.audit.record(
        { action, category: 'DEPARTMENT', resourceType: 'department', resourceId: id, before: existing, after: data },
        tx,
      );
      return department;
    });
  }
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @RequirePermission('department.read')
  @Get()
  async list(): Promise<ApiSuccessResponse<DepartmentSummary[]>> {
    return { success: true, data: await this.departments.list() };
  }

  @RequirePermission('department.create')
  @Post()
  async create(@Body() body: unknown): Promise<ApiSuccessResponse<DepartmentSummary>> {
    return { success: true, data: await this.departments.create(parseInput(createSchema, body)) };
  }

  @RequirePermission('department.update')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<ApiSuccessResponse<DepartmentSummary>> {
    const data = parseInput(updateSchema, body);
    return { success: true, data: await this.departments.update(parseId(id), data, 'DEPARTMENT_UPDATED') };
  }

  @RequirePermission('department.disable')
  @Post(':id/disable')
  @HttpCode(HttpStatus.OK)
  async disable(@Param('id') id: string): Promise<ApiSuccessResponse<DepartmentSummary>> {
    return { success: true, data: await this.departments.update(parseId(id), { status: 'DISABLED' }, 'DEPARTMENT_DISABLED') };
  }
}
