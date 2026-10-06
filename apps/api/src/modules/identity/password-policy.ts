import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../common/errors';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';

/** Upper bound protects the hashing endpoint from oversized inputs. */
export const PASSWORD_MAX_LENGTH = 256;

export function passwordPolicyViolations(password: string, minLength: number, username?: string): string[] {
  const violations: string[] = [];
  const length = [...password].length;
  if (length < minLength) violations.push(`must be at least ${minLength} characters`);
  if (length > PASSWORD_MAX_LENGTH) violations.push(`must be at most ${PASSWORD_MAX_LENGTH} characters`);
  if (password.trim().length === 0) violations.push('must not be blank');
  if (new Set(password).size < 4) violations.push('must contain at least 4 distinct characters');
  if (username && username.length >= 3 && password.toLowerCase().includes(username.toLowerCase())) {
    violations.push('must not contain the username');
  }
  return violations;
}

@Injectable()
export class PasswordPolicy {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get minLength(): number {
    return this.config.auth.passwordMinLength;
  }

  assertAcceptable(password: string, username?: string): void {
    const violations = passwordPolicyViolations(password, this.minLength, username);
    if (violations.length > 0) {
      throw new AppError(
        'PASSWORD_POLICY_VIOLATION',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'The password does not meet the password policy.',
        { violations },
      );
    }
  }
}
