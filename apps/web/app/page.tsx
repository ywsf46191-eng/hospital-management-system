import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getTranslator } from '@/lib/i18n/server';

export default async function HomePage() {
  const { t } = await getTranslator();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('home.kicker')}</p>
      <h1 className="text-3xl font-semibold text-foreground">{t('app.name')}</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{t('home.intro')}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/login">{t('home.signIn')}</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/health">{t('home.health')}</Link>
        </Button>
      </div>
    </main>
  );
}
