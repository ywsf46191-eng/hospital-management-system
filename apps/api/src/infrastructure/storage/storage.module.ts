import { Global, Module } from '@nestjs/common';
import { MinioObjectStorage } from './minio-object-storage';
import { ObjectStorage } from './object-storage';

@Global()
@Module({
  providers: [MinioObjectStorage, { provide: ObjectStorage, useExisting: MinioObjectStorage }],
  exports: [ObjectStorage, MinioObjectStorage],
})
export class StorageModule {}
