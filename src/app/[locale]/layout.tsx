import { headers } from 'next/headers';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { routing } from '@/i18n/routing';
import { auth } from '@/lib/auth';

type LocaleLayoutProps = {
  children: ReactNode;
  params: {
    locale: string;
  };
};

type SessionUser = {
  user?: {
    name?: string | null;
    image?: string | null;
  };
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const session = (await auth.api.getSession({
    headers: new Headers(headers())
  })) as SessionUser | null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-locale={locale} className="min-h-screen">
        <Header locale={locale} userName={session?.user?.name} userImage={session?.user?.image} />
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
