import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type {
  AuthenticationResult,
  CredentialManager,
  CredentialWriter,
  IdentityProvider,
  PasswordCredentials,
} from './identity-provider';
import { PasswordHasher } from './password-hasher';

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Application-managed identities: Argon2id hashes in `user_credentials`. */
@Injectable()
export class LocalIdentityProvider implements IdentityProvider, CredentialManager {
  readonly id = 'local';
  readonly credentials: CredentialManager = this;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
  ) {}

  async authenticate({ username, password }: PasswordCredentials): Promise<AuthenticationResult> {
    const user = await this.prisma.user.findUnique({
      where: { username: normalizeUsername(username) },
      select: { id: true, credential: true },
    });
    if (!user) {
      await this.hasher.verifyDummy(password);
      return { ok: false, reason: 'UNKNOWN_USER' };
    }
    if (!user.credential) {
      await this.hasher.verifyDummy(password);
      return { ok: false, reason: 'NO_CREDENTIALS', userId: user.id };
    }
    const valid = await this.hasher.verify(user.credential.passwordHash, password);
    return valid
      ? { ok: true, userId: user.id, passwordChangeRequired: user.credential.mustChange }
      : { ok: false, reason: 'INVALID_CREDENTIALS', userId: user.id };
  }

  async setPassword(
    userId: string,
    password: string,
    { mustChange }: { mustChange: boolean },
    tx: CredentialWriter = this.prisma,
  ): Promise<void> {
    const passwordHash = await this.hasher.hash(password);
    const now = new Date();
    await tx.userCredential.upsert({
      where: { userId },
      create: { userId, passwordHash, mustChange, passwordChangedAt: now },
      update: { passwordHash, mustChange, passwordChangedAt: now },
    });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const credential = await this.prisma.userCredential.findUnique({ where: { userId } });
    if (!credential) {
      await this.hasher.verifyDummy(password);
      return false;
    }
    return this.hasher.verify(credential.passwordHash, password);
  }
}
