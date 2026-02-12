import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createTripAndRedirectAction } from '@/app/actions/trips';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type NewTripPageProps = {
  params: {
    locale: string;
  };
};

export default async function NewTripPage({ params }: NewTripPageProps) {
  const { locale } = params;
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const createTripAction = createTripAndRedirectAction.bind(null, locale);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
        <CardHeader>
          <CardTitle className="text-xl">{tTrips('newTrip')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTripAction} className="flex flex-col gap-4">
            <Input name="title" placeholder={tTrips('defaultTitle')} />
            <div className="flex items-center gap-2">
              <Button type="submit">{tCommon('save')}</Button>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                href={`/${locale}/trips`}
              >
                {tCommon('cancel')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
