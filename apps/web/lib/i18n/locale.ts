export const LOCALE_COOKIE = 'hospital_locale';
export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export function parseLocale(value: string | undefined | null): Locale {
  return value === 'ar' ? 'ar' : 'en';
}

export function localeDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Non-HttpOnly locale cookie (not a secret). Path=/ so every route sees it. */
export function localeCookieString(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
}
