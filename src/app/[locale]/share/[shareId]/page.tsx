import { notFound } from 'next/navigation';
import { TripViewOnly } from '@/components/trips/trip-view-only';
import { getSharedTrip } from '@/lib/db/queries/shares';

type SharedTripPageProps = {
  params: {
    locale: string;
    shareId: string;
  };
};

export default async function SharedTripPage({ params }: SharedTripPageProps) {
  const trip = await getSharedTrip(params.shareId);

  if (!trip) {
    notFound();
  }

  return <TripViewOnly locale={params.locale} trip={trip} />;
}
