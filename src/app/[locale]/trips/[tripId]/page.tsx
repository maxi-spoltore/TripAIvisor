import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DestinationList } from '@/components/trips/destination-list';
import { TripHeader } from '@/components/trips/trip-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { getTripById } from '@/lib/db/queries/trips';
import { exportTrip } from '@/lib/utils/import-export';

type TripEditorPageProps = {
  params: {
    locale: string;
    tripId: string;
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

export default async function TripEditorPage({ params }: TripEditorPageProps) {
  const { locale, tripId: tripIdParam } = params;
  const tripId = Number(tripIdParam);

  if (!Number.isFinite(tripId)) {
    notFound();
  }

  const session = (await auth.api.getSession({
    headers: new Headers(headers())
  })) as SessionUser | null;

  const userId = parseUserId(session);
  if (!userId) {
    redirect(`/${locale}/login`);
  }

  const trip = await getTripById(tripId);

  if (!trip || trip.user_id !== userId) {
    notFound();
  }

  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const totalDays = trip.destinations.reduce((acc, destination) => acc + destination.duration, 0);
  const exportedTrip = exportTrip(trip);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <TripHeader
        exportData={exportedTrip}
        locale={locale}
        startDate={trip.start_date}
        title={trip.title}
        totalDays={totalDays}
        tripId={trip.trip_id}
      />

      <Card>
        <CardHeader>
          <CardTitle>{tTrips('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            {tTrips('departureFrom', { city: trip.departure_city })}
          </p>
          <p>
            {tTrips('returnTo', { city: trip.return_city ?? trip.departure_city })}
          </p>
        </CardContent>
      </Card>

      <DestinationList destinations={trip.destinations} locale={locale} startDate={trip.start_date} tripId={trip.trip_id} />
    </main>
  );
}
