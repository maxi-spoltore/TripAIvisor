import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { LocaleSwitcher } from './locale-switcher';

type HeaderProps = {
  userName?: string | null;
  userImage?: string | null;
  locale: string;
};

export function Header({ userName, userImage, locale }: HeaderProps) {
  const initials = userName
    ? userName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trip<span className="text-primary-600">AI</span>visor
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {userImage ? (
            <img
              alt={userName ?? 'User'}
              src={userImage}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : initials ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {initials}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
