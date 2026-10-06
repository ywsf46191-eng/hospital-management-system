import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/** Argon2id with OWASP-recommended minimum parameters (19 MiB memory, 2 iterations, 1 lane). */
const ARGON2ID_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

@Injectable()
export class PasswordHasher {
  private dummyHash: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return hash(password, ARGON2ID_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /** Spends the same time as a real verification so unknown usernames are not distinguishable. */
  async verifyDummy(password: string): Promise<void> {
    this.dummyHash ??= this.hash(`dummy-${Date.now()}-${Math.random()}`);
    await this.verify(await this.dummyHash, password);
  }
}
