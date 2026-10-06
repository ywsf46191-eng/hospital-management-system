'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { localeCookieString, parseLocale, type Locale } from '@/lib/i18n/locale';
import { createTranslator, type Translator } from '@/lib/i18n/translate';

interface LocaleContextValue {
  locale: Locale;
  t: Translator;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale: initial, children }: { locale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const setLocale = useCallback((next: Locale) => {
    const value = parseLocale(next);
    document.cookie = localeCookieString(value);
    setLocaleState(value);
    document.documentElement.lang = value;
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
  }, []);
  const context = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);
  return <LocaleContext.Provider value={context}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useI18n must be used inside LocaleProvider');
  return value;
}
