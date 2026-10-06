import { cookies } from 'next/headers';
import { LOCALE_COOKIE, parseLocale, type Locale } from './locale';
import { createTranslator, type Translator } from './translate';

export async function getRequestLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getTranslator(): Promise<{ locale: Locale; t: Translator }> {
  const locale = await getRequestLocale();
  return { locale, t: createTranslator(locale) };
}
