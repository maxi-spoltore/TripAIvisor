import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createTripAndRedirectAction } from '@/app/actions/trips';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <Card className="overflow-hidden border-border bg-surface shadow-card">
        <div className="h-1.5 bg-gradient-to-r from-brand-route via-brand-primary to-brand-accent" />
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-title-lg text-foreground-primary sm:text-display-md">{tTrips('newTrip')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={createTripAction} className="space-y-4">
            <Input name="title" placeholder={tTrips('defaultTitle')} />
            <div className="space-y-1.5">
              <Label className="text-label-md text-foreground-secondary" htmlFor="departure_city">{tTrips('departureCity')}</Label>
              <Input id="departure_city" name="departure_city" placeholder={tTrips('departureCityPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-label-md text-foreground-secondary" htmlFor="return_city">{tTrips('returnCity')}</Label>
              <Input id="return_city" name="return_city" placeholder={tTrips('returnCityPlaceholder')} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button className="sm:w-auto" type="submit">{tCommon('save')}</Button>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-body-sm font-semibold text-foreground-primary transition-colors duration-base ease-standard hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
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
