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
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-primary-50/50 to-white p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <PlaneTakeoff className="h-4 w-4 text-primary-500" />
        {editingDeparture ? (
          <Input
            autoFocus
            className="h-8 min-w-[170px]"
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
            className="rounded px-1 text-left transition-colors hover:text-primary-700"
            disabled={isPending}
            onClick={() => setEditingDeparture(true)}
            type="button"
          >
            {departureDisplay}
          </button>
        )}
      </div>

      <div className="flex-1 border-t border-dashed border-primary-300" />

      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {editingReturn ? (
          <Input
            autoFocus
            className="h-8 min-w-[170px]"
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
            className="rounded px-1 text-left transition-colors hover:text-primary-700"
            disabled={isPending}
            onClick={() => setEditingReturn(true)}
            type="button"
          >
            {returnDisplay}
          </button>
        )}
        <PlaneLanding className="h-4 w-4 text-primary-500" />
      </div>
    </div>
  );
}
