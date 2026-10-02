import { z } from 'zod';

export const hospitalTypeSchema = z.enum(['GOVERNMENT', 'PRIVATE', 'NON_PROFIT']);

export const healthStatusSchema = z.enum(['ok', 'degraded', 'down']);

export const nonEmptyStringSchema = z.string().trim().min(1);

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  return schema.parse(input);
}
