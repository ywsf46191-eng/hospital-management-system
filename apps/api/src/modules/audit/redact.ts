const SENSITIVE_KEY = /pass(word)?|secret|token|hash|cookie|authorization|csrf|credential/i;
const MAX_DEPTH = 6;

/** Removes secrets from audit payloads (SECURITY_ARCHITECTURE.md §27, §46). */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (depth > MAX_DEPTH) return '[TRUNCATED]';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item, depth + 1),
      ]),
    );
  }
  return value;
}
