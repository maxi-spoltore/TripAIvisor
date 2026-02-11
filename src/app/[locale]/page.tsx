import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CreateTripButton } from '@/components/trips/create-trip-button';
import { ImportTripButton } from '@/components/trips/import-trip-button';
import { TripCard } from '@/components/trips/trip-card';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { getUserTrips } from '@/lib/db/queries/trips';

type DashboardPageProps = {
  params: {
    locale: string;
  };
};

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
  };
};

function parseUserId(session: SessionUser | null): number | null {
  const rawUserId = session?.user?.id ?? session?.user?.user_id;
  const userId = Number(rawUserId);

  return Number.isFinite(userId) ? userId : null;
}

export default async function LocaleDashboardPage({ params }: DashboardPageProps) {
  const { locale } = params;
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const session = (await auth.api.getSession({
    headers: new Headers(headers())
  })) as SessionUser | null;

  const userId = parseUserId(session);
  if (!userId) {
    redirect(`/${locale}/login`);
  }

  const trips = await getUserTrips(userId);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-semibold">{tTrips('title')}</h1>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
          <ImportTripButton label={tTrips('import')} loadingLabel={tTrips('importing')} locale={locale} />
          <CreateTripButton href={`/${locale}/trips/new`} label={tTrips('newTrip')} />
        </div>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            {locale === 'es' ? 'No tienes viajes todavía.' : 'You do not have trips yet.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <TripCard
              key={trip.trip_id}
              editLabel={tCommon('edit')}
              locale={locale}
              selectDateLabel={tCommon('selectDate')}
              trip={trip}
            />
          ))}
        </div>
      )}
    </main>
  );
}
