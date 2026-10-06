import { Module } from '@nestjs/common';
import { DepartmentsController, DepartmentsService } from './departments.controller';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { UserManagementPolicy } from './user-management.policy';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, RolesController, DepartmentsController, PlatformController],
  providers: [UserManagementPolicy, UsersService, RolesService, DepartmentsService, PlatformService],
})
export class AdministrationModule {}
