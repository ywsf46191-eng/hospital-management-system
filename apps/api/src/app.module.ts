import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AccessGuard } from './modules/access-control/access.guard';
import { AdministrationModule } from './modules/administration/administration.module';
import { SecurityModule } from './modules/security.module';

@Module({
  imports: [AppConfigModule, InfrastructureModule, SecurityModule, HealthModule, AdministrationModule],
  providers: [
    { provide: APP_GUARD, useExisting: AccessGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('{*path}');
  }
}
