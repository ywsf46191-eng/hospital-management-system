import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { AppError } from './errors';

/** Parses untrusted input. Error details list field paths and messages, never input values. */
export function parseInput<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, 'Request validation failed.', {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

export const uuidSchema = z.string().uuid();

export function parseId(value: unknown): string {
  return parseInput(uuidSchema, value);
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
