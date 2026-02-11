import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, getDestinationDates, getTotalDays } from '@/lib/utils/dates';
import type { DestinationWithRelations, TripWithRelations } from '@/types/database';

type TripViewOnlyProps = {
  locale: string;
  trip: TripWithRelations;
};

function formatDateRange(locale: string, startDate: string | null, destinations: DestinationWithRelations[]): string | null {
  if (!startDate) {
    return null;
  }

  const totalDays = getTotalDays(destinations);
  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const startLabel = formatDate(startDate, localeTag);

  if (totalDays <= 0) {
    return startLabel;
  }

  const end = getDestinationDates(startDate, destinations, destinations.length - 1).end;
  if (!end) {
    return startLabel;
  }

  const endLabel = formatDate(end, localeTag);
  return `${startLabel} - ${endLabel}`;
}

function renderDurationLabel(locale: string, duration: number): string {
  return locale === 'es' ? `${duration} días` : `${duration} days`;
}

export function TripViewOnly({ locale, trip }: TripViewOnlyProps) {
  const title = locale === 'es' ? 'Viaje compartido' : 'Shared trip';
  const emptyState = locale === 'es' ? 'No hay destinos para mostrar.' : 'There are no destinations to show.';
  const dateRange = formatDateRange(locale, trip.start_date, trip.destinations);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{trip.title}</h1>
        {dateRange ? <p className="mt-3 text-sm text-slate-600">{dateRange}</p> : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'es' ? 'Itinerario' : 'Itinerary'}</CardTitle>
        </CardHeader>
        <CardContent>
          {trip.destinations.length === 0 ? (
            <p className="text-sm text-slate-600">{emptyState}</p>
          ) : (
            <ol className="space-y-3">
              {trip.destinations.map((destination, index) => {
                const dates = getDestinationDates(trip.start_date, trip.destinations, index);
                const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
                const destinationRange =
                  dates.start && dates.end ? `${formatDate(dates.start, localeTag)} - ${formatDate(dates.end, localeTag)}` : null;

                return (
                  <li
                    key={destination.destination_id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-semibold text-slate-900">{destination.city}</p>
                      <p className="text-sm text-slate-600">{renderDurationLabel(locale, destination.duration)}</p>
                    </div>
                    {destinationRange ? <p className="mt-1 text-sm text-slate-500">{destinationRange}</p> : null}
                    {destination.notes ? <p className="mt-2 text-sm text-slate-700">{destination.notes}</p> : null}
                    {destination.budget !== null ? (
                      <p className="mt-2 text-sm text-slate-700">
                        {locale === 'es' ? 'Presupuesto:' : 'Budget:'} ${destination.budget}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
