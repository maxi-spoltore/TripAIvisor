import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { CreateTripButton } from '@/components/trips/create-trip-button';
import { ImportTripButton } from '@/components/trips/import-trip-button';
import { TripCard } from '@/components/trips/trip-card';
import { auth } from '@/lib/auth';
import { getTripDestinationStats, getUserTrips } from '@/lib/db/queries/trips';

type TripsListPageProps = {
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

export default async function TripsListPage({ params }: TripsListPageProps) {
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
    <main className="vt-route-shell mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-display-md text-foreground-primary">{tTrips('title')}</h1>
          <p className="max-w-2xl text-body-sm text-foreground-secondary">{tTrips('listDescription')}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:min-w-[18rem]">
          <ImportTripButton label={tTrips('import')} loadingLabel={tTrips('importing')} locale={locale} />
          <CreateTripButton href={`/${locale}/trips/new`} label={tTrips('newTrip')} />
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border-strong bg-surface px-5 py-12 text-center shadow-card sm:py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent-soft sm:h-16 sm:w-16">
            <MapPin aria-hidden="true" className="h-7 w-7 text-brand-primary sm:h-8 sm:w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-title-md font-semibold text-foreground-primary">{tTrips('noTripsTitle')}</p>
            <p className="text-body-sm text-foreground-secondary">{tTrips('noTripsDescription')}</p>
          </div>
          <CreateTripButton href={`/${locale}/trips/new`} label={tTrips('newTrip')} />
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
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
