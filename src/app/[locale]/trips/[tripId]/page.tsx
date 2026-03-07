import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DestinationList } from '@/components/trips/destination-list';
import { TripDetailHint } from '@/components/trips/trip-detail-hint';
import { TripCityBanner } from '@/components/trips/trip-city-banner';
import { TripHeader } from '@/components/trips/trip-header';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { auth } from '@/lib/auth';
import { getTripById } from '@/lib/db/queries/trips';
import { resolveCityImages } from '@/lib/images/city-image-resolver';
import { calculateDate } from '@/lib/utils/dates';
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
  const travelDays = trip.departure_transport?.travel_days ?? 0;
  const totalDays = trip.destinations.reduce((acc, destination) => acc + destination.duration, 0);
  const returnDate = calculateDate(trip.start_date, travelDays + totalDays);
  const exportedTrip = exportTrip(trip);
  const transitionName = `trip-shell-${trip.trip_id}`;

  const allCityNames = [
    ...trip.destinations.map((d) => d.city),
    trip.departure_city,
    trip.return_city
  ].filter((c): c is string => Boolean(c));
  const cityImagesMap = await resolveCityImages(allCityNames);
  const cityImages = Object.fromEntries(cityImagesMap);

  return (
    <main
      className="vt-route-shell mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 md:px-8 md:py-8"
      style={{ viewTransitionName: transitionName }}
    >
      <ViewTransitionLink
        className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-body-sm font-semibold text-foreground-secondary transition-colors duration-fast ease-standard hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        href={`/${locale}/trips`}
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {tTrips('backToTrips')}
      </ViewTransitionLink>

      <TripDetailHint />

      <TripHeader
        endDate={trip.end_date}
        exportData={exportedTrip}
        locale={locale}
        startDate={trip.start_date}
        title={trip.title}
        totalDays={totalDays}
        tripId={trip.trip_id}
      />

      <TripCityBanner
        departureCity={trip.departure_city}
        locale={locale}
        returnCity={trip.return_city}
        tripId={trip.trip_id}
      />

      <DestinationList
        cityImages={cityImages}
        departureCity={trip.departure_city}
        departureTransport={trip.departure_transport}
        destinations={trip.destinations}
        locale={locale}
        returnCity={trip.return_city ?? trip.departure_city}
        returnDate={returnDate}
        returnTransport={trip.return_transport}
        startDate={trip.start_date}
        travelDays={travelDays}
        tripId={trip.trip_id}
      />
    </main>
  );
}
