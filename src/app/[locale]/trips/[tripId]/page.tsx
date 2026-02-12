import { ArrowLeft, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DestinationList } from '@/components/trips/destination-list';
import { TripHeader } from '@/components/trips/trip-header';
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
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        href={`/${locale}/trips`}
      >
        <ArrowLeft className="h-4 w-4" />
        {tTrips('backToTrips')}
      </Link>

      <TripHeader
        exportData={exportedTrip}
        locale={locale}
        startDate={trip.start_date}
        title={trip.title}
        totalDays={totalDays}
        tripId={trip.trip_id}
      />

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-primary-50/50 to-white p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <PlaneTakeoff className="h-4 w-4 text-primary-500" />
          <span>{trip.departure_city}</span>
        </div>

        <div className="flex-1 border-t border-dashed border-primary-300" />

        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>{trip.return_city ?? trip.departure_city}</span>
          <PlaneLanding className="h-4 w-4 text-primary-500" />
        </div>
      </div>

      <DestinationList destinations={trip.destinations} locale={locale} startDate={trip.start_date} tripId={trip.trip_id} />
    </main>
  );
}
