import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { CreateTripButton } from '@/components/trips/create-trip-button';
import { ImportTripButton } from '@/components/trips/import-trip-button';
import { TripCard } from '@/components/trips/trip-card';
import { auth } from '@/lib/auth';
import { getTripDestinationStats, getUserTrips } from '@/lib/db/queries/trips';

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
  const tripStats = await getTripDestinationStats(trips.map((trip) => trip.trip_id));

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
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <MapPin className="h-8 w-8 text-primary-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{tTrips('noTripsTitle')}</p>
            <p className="mt-1 text-sm text-slate-500">{tTrips('noTripsDescription')}</p>
          </div>
          <CreateTripButton href={`/${locale}/trips/new`} label={tTrips('newTrip')} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {trips.map((trip) => {
            const stats = tripStats[trip.trip_id] ?? { destinationCount: 0, totalDays: 0 };

            return (
              <TripCard
                key={trip.trip_id}
                destinationCount={stats.destinationCount}
                editLabel={tCommon('edit')}
                locale={locale}
                selectDateLabel={tCommon('selectDate')}
                totalDays={stats.totalDays}
                trip={trip}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
