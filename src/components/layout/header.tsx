import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from './user-menu';

type HeaderProps = {
  userName?: string | null;
  userImage?: string | null;
  locale: string;
};

export function Header({ userName, userImage, locale }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6 md:px-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 rounded-md px-1 py-1 transition-colors duration-base ease-standard hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-white shadow-shadow-1">
            <MapPin aria-hidden="true" className="h-4 w-4" />
          </div>
          <span className="font-display text-title-md font-bold tracking-tight text-foreground-primary sm:text-title-lg">
            Trip<span className="text-brand-primary">AI</span>visor
          </span>
        </Link>
        <UserMenu locale={locale} userName={userName} userImage={userImage} />
      </div>
    </header>
  );
}
