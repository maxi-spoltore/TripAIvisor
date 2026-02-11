import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { routing } from '@/i18n/routing';

type LocaleLayoutProps = {
  children: ReactNode;
  params: {
    locale: string;
  };
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-locale={locale} className="min-h-screen">
        <Header />
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
