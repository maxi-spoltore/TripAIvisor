'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
    <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-sm">
      {(['es', 'en'] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          className={cn(
            'rounded-md px-3 py-1 font-medium transition-all duration-150',
            locale === loc
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
          onClick={() => {
            if (loc !== locale) {
              router.push(replaceLocale(pathname, locale, loc));
            }
          }}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
