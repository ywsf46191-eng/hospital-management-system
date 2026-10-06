import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'minio';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import type { HealthIndicator } from '../health/health-indicator';
import { ObjectStorage } from './object-storage';

/**
 * MinIO adapter. Bucket creation and access policy are provisioned by the
 * infrastructure (minio-init job); the application account has no admin rights.
 */
@Injectable()
export class MinioObjectStorage extends ObjectStorage implements HealthIndicator {
  readonly component = 'objectStorage' as const;
  private readonly client: Client;
  private readonly bucket: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super();
    const storage = config.objectStorage;
    this.bucket = storage.bucket;
    this.client = new Client({
      endPoint: storage.endpoint,
      port: storage.port,
      useSSL: storage.useSSL,
      accessKey: storage.accessKey,
      secretKey: storage.secretKey,
    });
  }

  async ping(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      throw new Error('Configured bucket does not exist');
    }
  }

  async putObject(key: string, body: Buffer, contentType = 'application/octet-stream'): Promise<void> {
    await this.client.putObject(this.bucket, key, body, body.length, { 'Content-Type': contentType });
  }

  async getObject(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
    }
    return Buffer.concat(chunks);
  }

  async removeObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
