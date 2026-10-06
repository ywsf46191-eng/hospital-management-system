/**
 * MFA-ready extension point (P3-D8). No factor (TOTP etc.) is implemented in Phase 3:
 * AUTH_MFA_MODE only accepts `disabled`. A future policy decides per hospital/role/user whether a
 * session needs a second factor; `sessions.mfa_verified_at` records completion.
 */
export interface MfaRequirementContext {
  userId: string;
  tenantId: string | null;
}

export abstract class MfaPolicy {
  abstract isRequired(context: MfaRequirementContext): Promise<boolean>;
}

export class DisabledMfaPolicy extends MfaPolicy {
  async isRequired(): Promise<boolean> {
    return false;
  }
}
