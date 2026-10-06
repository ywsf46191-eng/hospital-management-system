import type { Prisma } from '@prisma/client';

export interface PasswordCredentials {
  username: string;
  password: string;
}

export type AuthenticationFailureReason = 'UNKNOWN_USER' | 'INVALID_CREDENTIALS' | 'NO_CREDENTIALS';

export type AuthenticationResult =
  | { ok: true; userId: string; passwordChangeRequired: boolean }
  | { ok: false; reason: AuthenticationFailureReason; userId?: string };

/** Any Prisma client or transaction client, including tenant-extended ones. */
export interface CredentialWriter {
  userCredential: { upsert(args: Prisma.UserCredentialUpsertArgs): Promise<unknown> };
}

/** Credential management is optional: an external IdP (e.g. Keycloak) owns passwords itself. */
export interface CredentialManager {
  setPassword(userId: string, password: string, options: { mustChange: boolean }, tx?: CredentialWriter): Promise<void>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
}

/**
 * Identity provider port (ADP-003). Everything after authentication — sessions, tenant context,
 * RBAC, audit — depends only on the internal user id, so a Keycloak/OIDC provider can replace
 * the local provider without changing business modules.
 */
export abstract class IdentityProvider {
  abstract readonly id: string;
  abstract readonly credentials: CredentialManager | null;
  abstract authenticate(credentials: PasswordCredentials): Promise<AuthenticationResult>;
}
