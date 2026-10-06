'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useI18n } from '@/components/locale-provider';

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" aria-label={t('common.language')}>
          <Languages />
          {locale === 'ar' ? t('common.arabic') : t('common.english')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setLocale('en')}>{t('common.english')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLocale('ar')}>{t('common.arabic')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
