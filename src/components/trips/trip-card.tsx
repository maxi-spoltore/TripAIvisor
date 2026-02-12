import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Calendar, MapPin } from 'lucide-react';
import { deleteTripForLocaleAction } from '@/app/actions/trips';
import { DeleteTripButton } from '@/components/trips/delete-trip-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Trip } from '@/types/database';

type TripCardProps = {
  locale: string;
  trip: Trip;
  editLabel: string;
  selectDateLabel: string;
  destinationCount: number;
  totalDays: number;
};

export async function TripCard({
  locale,
  trip,
  editLabel,
  selectDateLabel,
  destinationCount,
  totalDays
}: TripCardProps) {
  const deleteTripAction = deleteTripForLocaleAction.bind(null, locale);
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const destinationLabel =
    destinationCount > 0 ? tTrips('destinations', { count: destinationCount }) : tTrips('noDestinations');
  const daysLabel = totalDays > 0 ? tTrips('days', { count: totalDays }) : null;

  return (
    <Card className="group overflow-hidden hover:border-primary-200 hover:shadow-md">
      <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{trip.title}</CardTitle>
          <form action={deleteTripAction}>
            <input name="tripId" type="hidden" value={String(trip.trip_id)} />
            <DeleteTripButton />
          </form>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {trip.start_date ?? selectDateLabel}
          </span>
          {daysLabel ? (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {daysLabel}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {destinationLabel}
          </span>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-medium text-white transition-all duration-150 hover:bg-primary-700 active:scale-[0.98]"
          href={`/${locale}/trips/${trip.trip_id}`}
        >
          {editLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
