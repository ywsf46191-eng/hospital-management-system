import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { PrismaService } from './database/prisma.service';
import { HEALTH_INDICATORS, type HealthIndicator } from './health/health-indicator';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { MinioObjectStorage } from './storage/minio-object-storage';
import { StorageModule } from './storage/storage.module';

@Global()
@Module({
  imports: [DatabaseModule, RedisModule, StorageModule],
  providers: [
    {
      provide: HEALTH_INDICATORS,
      inject: [PrismaService, RedisService, MinioObjectStorage],
      useFactory: (...indicators: HealthIndicator[]): HealthIndicator[] => indicators,
    },
  ],
  exports: [DatabaseModule, RedisModule, StorageModule, HEALTH_INDICATORS],
})
export class InfrastructureModule {}
