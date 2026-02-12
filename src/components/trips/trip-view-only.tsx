import { Calendar, Eye } from 'lucide-react';
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
  const title = locale === 'es' ? 'Viaje compartido' : 'Shared Trip';
  const readOnlyBanner =
    locale === 'es' ? 'Estás viendo un viaje compartido (solo lectura)' : 'You are viewing a shared trip (read-only)';
  const emptyState = locale === 'es' ? 'No hay destinos para mostrar.' : 'There are no destinations to show.';
  const dateRange = formatDateRange(locale, trip.start_date, trip.destinations);
  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
        <Eye className="h-4 w-4" />
        {readOnlyBanner}
      </div>

      <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">{title}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{trip.title}</h1>
          {dateRange ? (
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              <Calendar className="h-3.5 w-3.5" />
              {dateRange}
            </span>
          ) : null}
        </div>
      </header>

      {trip.destinations.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyState}</p>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute bottom-6 left-5 top-6 w-0.5 bg-slate-200" />
          {trip.destinations.map((destination, index) => {
            const dates = getDestinationDates(trip.start_date, trip.destinations, index);
            const destinationRange =
              dates.start && dates.end ? `${formatDate(dates.start, localeTag)} - ${formatDate(dates.end, localeTag)}` : null;

            return (
              <div key={destination.destination_id} className="relative flex gap-4 pb-4">
                <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-300 bg-white text-sm font-bold text-primary-700">
                  {index + 1}
                </div>

                <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{destination.city}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {renderDurationLabel(locale, destination.duration)}
                    </span>
                  </div>
                  {destinationRange ? <p className="mt-1 text-sm text-slate-500">{destinationRange}</p> : null}
                  {destination.notes ? <p className="mt-3 text-sm text-slate-700">{destination.notes}</p> : null}
                  {destination.budget !== null ? (
                    <p className="mt-2 text-sm text-slate-700">
                      {locale === 'es' ? 'Presupuesto:' : 'Budget:'} ${destination.budget}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
