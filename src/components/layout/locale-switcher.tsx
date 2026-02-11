'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import type { AppLocale } from '@/i18n/routing';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

const LOCALE_LABELS: Record<AppLocale, string> = {
  es: 'Español',
  en: 'English'
};

function replaceLocale(pathname: string, fromLocale: string, toLocale: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return `/${toLocale}`;
  }

  if (segments[0] === fromLocale) {
    segments[0] = toLocale;
    return `/${segments.join('/')}`;
  }

  segments.unshift(toLocale);
  return `/${segments.join('/')}`;
}

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        router.push(replaceLocale(pathname, locale, value));
      }}
    >
      <SelectTrigger className="w-28">
        {LOCALE_LABELS[locale as AppLocale] ?? locale}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}
