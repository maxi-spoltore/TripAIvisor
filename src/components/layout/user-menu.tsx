'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Globe, LogOut, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  userName: string | null | undefined;
  userImage: string | null | undefined;
  locale: string;
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

export function UserMenu({ userName, userImage, locale }: UserMenuProps) {
  const tAuth = useTranslations('auth');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || `/${currentLocale}`;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const initials = userName
    ? userName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = `/${locale}/login`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full leading-none transition-opacity hover:opacity-90"
      >
        {userImage ? (
          <img alt={userName ?? 'User'} src={userImage} className="block h-8 w-8 rounded-full object-cover" />
        ) : initials ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {initials}
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            U
          </div>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] animate-fade-in rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="px-4 py-2 text-sm font-medium text-slate-900">{userName ?? 'User'}</div>
          <div className="border-t border-slate-100" />

          <div className="px-4 py-2">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Globe className="h-3.5 w-3.5" />
              {tAuth('language')}
            </div>
            <div className="space-y-1">
              {(['es', 'en'] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  aria-pressed={currentLocale === loc}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors',
                    currentLocale === loc
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                  onClick={() => {
                    if (loc !== currentLocale) {
                      router.push(replaceLocale(pathname, currentLocale, loc));
                    }
                  }}
                >
                  {loc === 'en' ? 'English' : 'Español'}
                  <Check className={cn('h-4 w-4', currentLocale === loc ? 'opacity-100' : 'opacity-0')} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex cursor-not-allowed items-center gap-2 px-4 py-2 text-sm text-slate-400">
            <Settings className="h-4 w-4" />
            <span>{tAuth('settings')}</span>
            <span className="text-xs">({tAuth('comingSoon')})</span>
          </div>

          <div className="border-t border-slate-100" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {tAuth('signOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
