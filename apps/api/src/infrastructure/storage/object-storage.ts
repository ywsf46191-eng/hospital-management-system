/**
 * Storage port. Domain modules depend on this abstraction, never on a vendor SDK,
 * so MinIO (on-premise) and cloud object storage remain interchangeable.
 */
export abstract class ObjectStorage {
  /** Resolves when the configured bucket is reachable with the configured credentials. */
  abstract ping(): Promise<void>;

  abstract putObject(key: string, body: Buffer, contentType?: string): Promise<void>;

  abstract getObject(key: string): Promise<Buffer>;

  abstract removeObject(key: string): Promise<void>;
}
