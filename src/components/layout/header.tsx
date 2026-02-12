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
        <UserMenu locale={locale} userName={userName} userImage={userImage} />
      </div>
    </header>
  );
}
