import { z } from 'zod';
import { PASSWORD_MAX_LENGTH } from './password-policy';

/** Usernames are global identities (one account, many hospital memberships), stored lowercase. */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{2,63}$/, 'must be 3-64 characters: letters, digits, dot, underscore or hyphen');

export const displayNameSchema = z.string().trim().min(1).max(120);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const passwordInputSchema = z.string().min(1).max(PASSWORD_MAX_LENGTH);
