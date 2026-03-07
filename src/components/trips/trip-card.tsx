import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Calendar, MapPin } from 'lucide-react';
import { deleteTripForLocaleAction } from '@/app/actions/trips';
import { DeleteTripButton } from '@/components/trips/delete-trip-button';
import { TripCardImageCarousel } from '@/components/trips/trip-card-image-carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import type { CityImage, Trip } from '@/types/database';

type TripCardProps = {
  locale: string;
  trip: Trip;
  editLabel: string;
  selectDateLabel: string;
  destinationCount: number;
  totalDays: number;
  cityImages: CityImage[];
};

export async function TripCard({
  locale,
  trip,
  editLabel,
  selectDateLabel,
  destinationCount,
  totalDays,
  cityImages
}: TripCardProps) {
  const deleteTripAction = deleteTripForLocaleAction.bind(null, locale);
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const destinationLabel =
    destinationCount > 0 ? tTrips('destinations', { count: destinationCount }) : tTrips('noDestinations');
  const daysLabel = totalDays > 0 ? tTrips('days', { count: totalDays }) : null;
  const transitionName = `trip-shell-${trip.trip_id}`;

  return (
    <Card
      className="group overflow-hidden border-border bg-surface shadow-card transition-all duration-base ease-standard hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-floating"
      style={{ viewTransitionName: transitionName }}
    >
      {cityImages.length > 1 ? (
        <TripCardImageCarousel images={cityImages} />
      ) : cityImages.length === 1 ? (
        <div className="relative h-32 sm:h-36 lg:h-44">
          <Image
            alt=""
            className="object-cover [object-position:center_25%] lg:[object-position:center_30%]"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            src={`${cityImages[0].raw_url}&w=1200&q=80&fit=crop`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
          <p className="absolute bottom-1.5 right-2 text-[10px] text-white/70">
            Photo by <span className="font-medium">{cityImages[0].photographer_name}</span> / Unsplash
          </p>
        </div>
      ) : (
        <div className="relative h-32 overflow-hidden sm:h-36 lg:h-44">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-route to-brand-accent opacity-90" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 80px 80px, 40px 40px' }} />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-title-md font-semibold text-foreground-primary sm:text-title-lg">{trip.title}</CardTitle>
          <form action={deleteTripAction}>
            <input name="tripId" type="hidden" value={String(trip.trip_id)} />
            <DeleteTripButton />
          </form>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-body-sm text-foreground-secondary">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-subtle px-2.5 py-1">
            <Calendar aria-hidden="true" className="h-3.5 w-3.5 text-brand-route" />
            {trip.start_date ?? selectDateLabel}
          </span>
          {daysLabel ? (
            <span className="rounded-pill bg-brand-accent-soft px-2.5 py-1 text-label-md font-semibold text-brand-primary">
              {daysLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-subtle px-2.5 py-1">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-brand-route" />
            {destinationLabel}
          </span>
        </div>
        <ViewTransitionLink
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary px-4 text-body-sm font-semibold text-white transition-[background-color,transform] duration-base ease-standard hover:bg-brand-primary-hover active:translate-y-px sm:w-auto"
          href={`/${locale}/trips/${trip.trip_id}`}
        >
          {editLabel}
        </ViewTransitionLink>
      </CardContent>
    </Card>
  );
}
