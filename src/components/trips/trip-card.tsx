import Link from 'next/link';
import { deleteTripForLocaleAction } from '@/app/actions/trips';
import { DeleteTripButton } from '@/components/trips/delete-trip-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Trip } from '@/types/database';

type TripCardProps = {
  locale: string;
  trip: Trip;
  editLabel: string;
  selectDateLabel: string;
};

export function TripCard({ locale, trip, editLabel, selectDateLabel }: TripCardProps) {
  const deleteTripAction = deleteTripForLocaleAction.bind(null, locale);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{trip.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">{trip.start_date ?? selectDateLabel}</p>
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            href={`/${locale}/trips/${trip.trip_id}`}
          >
            {editLabel}
          </Link>
          <form action={deleteTripAction}>
            <input name="tripId" type="hidden" value={String(trip.trip_id)} />
            <DeleteTripButton />
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
