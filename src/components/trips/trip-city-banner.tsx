'use client';

import { PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateTripCitiesAction } from '@/app/actions/trips';
import { Input } from '@/components/ui/input';

type TripCityBannerProps = {
  locale: string;
  tripId: number;
  departureCity: string;
  returnCity: string | null;
};

const DEFAULT_DEPARTURE_CITY = 'Buenos Aires';

function normalizeDepartureCity(value: string): string {
  const normalized = value.trim();
  return normalized || DEFAULT_DEPARTURE_CITY;
}

function normalizeReturnCity(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}

export function TripCityBanner({ locale, tripId, departureCity, returnCity }: TripCityBannerProps) {
  const tTrips = useTranslations('trips');
  const [editingDeparture, setEditingDeparture] = useState(false);
  const [editingReturn, setEditingReturn] = useState(false);
  const [localDepartureCity, setLocalDepartureCity] = useState(departureCity);
  const [localReturnCity, setLocalReturnCity] = useState(returnCity ?? '');
  const [savedDepartureCity, setSavedDepartureCity] = useState(departureCity);
  const [savedReturnCity, setSavedReturnCity] = useState<string | null>(returnCity);
  const [isPending, startTransition] = useTransition();
  const skipDepartureBlurSaveRef = useRef(false);
  const skipReturnBlurSaveRef = useRef(false);

  useEffect(() => {
    setLocalDepartureCity(departureCity);
    setSavedDepartureCity(departureCity);
  }, [departureCity]);

  useEffect(() => {
    setLocalReturnCity(returnCity ?? '');
    setSavedReturnCity(returnCity);
  }, [returnCity]);

  const persistCities = (nextDepartureCity: string, nextReturnCity: string) => {
    const normalizedDepartureCity = normalizeDepartureCity(nextDepartureCity);
    const normalizedReturnCity = normalizeReturnCity(nextReturnCity);

    setLocalDepartureCity(normalizedDepartureCity);
    setLocalReturnCity(normalizedReturnCity ?? '');

    if (normalizedDepartureCity === savedDepartureCity && normalizedReturnCity === savedReturnCity) {
      return;
    }

    startTransition(async () => {
      await updateTripCitiesAction({
        locale,
        tripId,
        departureCity: normalizedDepartureCity,
        returnCity: normalizedReturnCity
      });

      setSavedDepartureCity(normalizedDepartureCity);
      setSavedReturnCity(normalizedReturnCity);
    });
  };

  const departureDisplay = normalizeDepartureCity(localDepartureCity);
  const returnDisplay = normalizeReturnCity(localReturnCity) ?? departureDisplay;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="grid gap-3 sm:items-center md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
        <div className="space-y-1 rounded-lg border border-border bg-elevated px-3 py-2">
          <span className="text-label-sm uppercase tracking-[0.03em] text-foreground-muted">{tTrips('departureCity')}</span>
          <div className="flex items-center gap-2 text-body-md font-semibold text-foreground-primary">
            <PlaneTakeoff aria-hidden="true" className="h-4 w-4 shrink-0 text-route" />
            {editingDeparture ? (
              <Input
                autoFocus
                className="h-10 min-w-0"
                disabled={isPending}
                onBlur={() => {
                  setEditingDeparture(false);
                  if (skipDepartureBlurSaveRef.current) {
                    skipDepartureBlurSaveRef.current = false;
                    return;
                  }

                  persistCities(localDepartureCity, localReturnCity);
                }}
                onChange={(event) => setLocalDepartureCity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                    return;
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    skipDepartureBlurSaveRef.current = true;
                    setLocalDepartureCity(savedDepartureCity);
                    event.currentTarget.blur();
                  }
                }}
                placeholder={tTrips('departureCityPlaceholder')}
                value={localDepartureCity}
              />
            ) : (
              <button
                className="min-w-0 rounded-md px-1 py-1 text-left text-body-md font-semibold text-foreground-primary transition-colors duration-fast ease-standard hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                disabled={isPending}
                onClick={() => setEditingDeparture(true)}
                type="button"
              >
                <span className="block truncate">{departureDisplay}</span>
              </button>
            )}
          </div>
        </div>

        <div className="hidden h-0.5 w-14 rounded-full bg-gradient-to-r from-route/35 to-brand-primary/45 md:block" />

        <div className="space-y-1 rounded-lg border border-border bg-elevated px-3 py-2">
          <span className="text-label-sm uppercase tracking-[0.03em] text-foreground-muted">{tTrips('returnCity')}</span>
          <div className="flex items-center gap-2 text-body-md font-semibold text-foreground-primary">
            {editingReturn ? (
              <Input
                autoFocus
                className="h-10 min-w-0"
                disabled={isPending}
                onBlur={() => {
                  setEditingReturn(false);
                  if (skipReturnBlurSaveRef.current) {
                    skipReturnBlurSaveRef.current = false;
                    return;
                  }

                  persistCities(localDepartureCity, localReturnCity);
                }}
                onChange={(event) => setLocalReturnCity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                    return;
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    skipReturnBlurSaveRef.current = true;
                    setLocalReturnCity(savedReturnCity ?? '');
                    event.currentTarget.blur();
                  }
                }}
                placeholder={tTrips('returnCityPlaceholder')}
                value={localReturnCity}
              />
            ) : (
              <button
                className="min-w-0 rounded-md px-1 py-1 text-left text-body-md font-semibold text-foreground-primary transition-colors duration-fast ease-standard hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                disabled={isPending}
                onClick={() => setEditingReturn(true)}
                type="button"
              >
                <span className="block truncate">{returnDisplay}</span>
              </button>
            )}
            <PlaneLanding aria-hidden="true" className="h-4 w-4 shrink-0 text-route" />
          </div>
        </div>
      </div>
    </div>
  );
}
