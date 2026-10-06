import type { ApiErrorBody } from '@hospital/types';
import { dictionaries } from './messages';
import type { Locale } from './locale';

function lookup(messages: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translator {
  const dict = dictionaries[locale];
  return (key, vars) => {
    let text = lookup(dict, key) ?? lookup(dictionaries.en, key) ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

export function translateError(t: Translator, error: ApiErrorBody): string {
  const mapped = t(`errors.${error.code}`);
  const message = mapped === `errors.${error.code}` ? error.message : mapped;
  const details = error.details as { issues?: { path: string; message: string }[]; violations?: string[] } | null | undefined;
  const extra = [
    ...(details?.issues ?? []).map((issue) => `${issue.path || 'input'}: ${issue.message}`),
    ...(details?.violations ?? []),
  ];
  return extra.length > 0 ? `${message} (${extra.join('; ')})` : message;
}

export function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', { timeStyle: 'short' }).format(new Date(value));
}
