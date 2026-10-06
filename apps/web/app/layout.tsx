import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { inter, notoSansArabic } from '@/lib/fonts';
import { LocaleProvider } from '@/components/locale-provider';
import { ToastProvider, ToastViewport } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LOCALE_COOKIE, localeDir, parseLocale } from '@/lib/i18n/locale';
import './globals.css';

export const metadata = {
  title: 'Hospital System',
  description: 'Hospital Information System',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale} dir={localeDir(locale)} className={`${inter.variable} ${notoSansArabic.variable}`}>
      <body>
        <LocaleProvider locale={locale}>
          <TooltipProvider>
            <ToastProvider swipeDirection="right">
              {children}
              <ToastViewport />
            </ToastProvider>
          </TooltipProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
