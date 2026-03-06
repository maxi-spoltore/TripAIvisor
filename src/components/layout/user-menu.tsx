'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  userName: string | null | undefined;
  userImage: string | null | undefined;
  locale: string;
};

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'tripaivisor-theme';

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

function readThemePreference(): ThemePreference {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      return storedTheme;
    }
  } catch {
    return 'system';
  }

  return 'system';
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return preference;
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const resolvedTheme = resolveTheme(preference);

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

export function UserMenu({ userName, userImage, locale }: UserMenuProps) {
  const tAuth = useTranslations('auth');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || `/${currentLocale}`;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const menuId = 'user-menu-panel';

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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const initialTheme = readThemePreference();

    setThemePreference(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    } catch {
      // Ignore storage errors and still apply the selected theme locally.
    }

    applyTheme(themePreference);

    if (themePreference !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [themePreference]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = `/${locale}/login`;
  };

  const themeOptions: Array<{
    value: ThemePreference;
    label: string;
    icon: typeof Sun;
  }> = [
    { value: 'light', label: tAuth('themeLight'), icon: Sun },
    { value: 'dark', label: tAuth('themeDark'), icon: Moon },
    { value: 'system', label: tAuth('themeSystem'), icon: Monitor }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-controls={open ? menuId : undefined}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-surface px-1.5 text-foreground-secondary shadow-shadow-1 transition-[border-color,box-shadow,color] duration-base ease-standard hover:border-border-strong hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {userImage ? (
          <img alt={userName ?? 'User'} src={userImage} className="block h-8 w-8 rounded-full object-cover" />
        ) : initials ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent-soft text-label-md font-semibold text-brand-primary">
            {initials}
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent-soft text-label-md font-semibold text-brand-primary">
            U
          </div>
        )}
        <ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-fast ease-standard', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] animate-fade-in rounded-xl border border-border bg-elevated py-2 shadow-floating"
          id={menuId}
          role="menu"
        >
          <div className="px-4 pb-2 text-body-sm font-semibold text-foreground-primary">{userName ?? 'User'}</div>
          <div className="border-t border-border" />

          <div className="space-y-2 px-4 py-3">
            <div className="flex items-center gap-2 text-label-sm uppercase tracking-[0.03em] text-foreground-muted">
              <Globe aria-hidden="true" className="h-3.5 w-3.5" />
              {tAuth('language')}
            </div>
            <div className="space-y-1">
              {(['es', 'en'] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  aria-checked={currentLocale === loc}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-body-sm font-semibold transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                    currentLocale === loc
                      ? 'bg-subtle text-foreground-primary'
                      : 'text-foreground-secondary hover:bg-subtle hover:text-foreground-primary'
                  )}
                  onClick={() => {
                    if (loc !== currentLocale) {
                      router.push(replaceLocale(pathname, currentLocale, loc));
                      setOpen(false);
                    }
                  }}
                  role="menuitemradio"
                >
                  {loc === 'en' ? 'English' : 'Español'}
                  <Check
                    aria-hidden="true"
                    className={cn('h-4 w-4 text-brand-primary transition-opacity duration-fast', currentLocale === loc ? 'opacity-100' : 'opacity-0')}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 px-4 pb-3">
            <div className="flex items-center gap-2 text-label-sm uppercase tracking-[0.03em] text-foreground-muted">
              <Monitor aria-hidden="true" className="h-3.5 w-3.5" />
              {tAuth('theme')}
            </div>
            <div className="space-y-1">
              {themeOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-checked={themePreference === option.value}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-body-sm font-semibold transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                      themePreference === option.value
                        ? 'bg-subtle text-foreground-primary'
                        : 'text-foreground-secondary hover:bg-subtle hover:text-foreground-primary'
                    )}
                    onClick={() => setThemePreference(option.value)}
                    role="menuitemradio"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon aria-hidden="true" className="h-4 w-4 text-brand-primary" />
                      {option.label}
                    </span>
                    <Check
                      aria-hidden="true"
                      className={cn(
                        'h-4 w-4 text-brand-primary transition-opacity duration-fast',
                        themePreference === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex cursor-not-allowed items-center gap-2 px-4 py-2 text-body-sm text-foreground-muted">
            <Settings aria-hidden="true" className="h-4 w-4" />
            <span>{tAuth('settings')}</span>
            <span className="text-label-sm">({tAuth('comingSoon')})</span>
          </div>

          <div className="mt-2 border-t border-border" />
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 flex w-full items-center gap-2 px-4 py-2 text-left text-body-sm font-semibold text-danger transition-colors duration-fast ease-standard hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            role="menuitem"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {tAuth('signOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
