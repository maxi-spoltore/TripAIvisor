'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bus, Edit2, Plane, Train } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateDepartureTransportAction } from '@/app/actions/trips';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/dates';
import type { Transport, TransportType } from '@/types/database';
import { DepartureTransportModal, type DepartureTransportSubmitInput } from './departure-transport-modal';

type DepartureCardProps = {
  locale: string;
  tripId: number;
  departureCity: string;
  startDate: string | null;
  departureTransport: Transport | null;
};

type LabelValue = {
  label: string;
  value: string;
};

function getTransportIconByType(transportType: TransportType | null | undefined) {
  if (transportType === 'train') {
    return Train;
  }

  if (transportType === 'bus') {
    return Bus;
  }

  return Plane;
}

function hasTransportContent(transport: Transport | null): boolean {
  if (!transport) {
    return false;
  }

  return Boolean(
    transport.transport_type !== 'plane' ||
      transport.leave_accommodation_time ||
      transport.terminal ||
      transport.company ||
      transport.booking_number ||
      transport.booking_code ||
      transport.departure_time ||
      transport.arrival_time ||
      transport.travel_days > 0
  );
}

function getTransportLabel(locale: string, transportType: TransportType): string {
  if (locale === 'es') {
    if (transportType === 'train') {
      return 'Tren';
    }

    if (transportType === 'bus') {
      return 'Bus';
    }

    return 'Avion';
  }

  if (transportType === 'train') {
    return 'Train';
  }

  if (transportType === 'bus') {
    return 'Bus';
  }

  return 'Plane';
}

function getTransportDetails(transport: Transport | null, locale: string): LabelValue[] {
  if (!transport || !hasTransportContent(transport)) {
    return [];
  }

  const details: LabelValue[] = [];

  if (transport.transport_type && transport.transport_type !== 'plane') {
    details.push({
      label: locale === 'es' ? 'Tipo' : 'Type',
      value: getTransportLabel(locale, transport.transport_type)
    });
  }

  if (transport.leave_accommodation_time) {
    details.push({
      label: locale === 'es' ? 'Salida alojamiento' : 'Leave accommodation',
      value: transport.leave_accommodation_time
    });
  }

  if (transport.terminal) {
    details.push({
      label: locale === 'es' ? 'Terminal' : 'Terminal',
      value: transport.terminal
    });
  }

  if (transport.company) {
    details.push({
      label: locale === 'es' ? 'Empresa' : 'Company',
      value: transport.company
    });
  }

  const reservation = [transport.booking_number, transport.booking_code].filter(Boolean).join(' / ');
  if (reservation) {
    details.push({
      label: locale === 'es' ? 'Reserva' : 'Reservation',
      value: reservation
    });
  }

  if (transport.departure_time) {
    details.push({
      label: locale === 'es' ? 'Hora salida' : 'Departure time',
      value: transport.departure_time
    });
  }

  if (transport.arrival_time) {
    details.push({
      label: locale === 'es' ? 'Hora llegada' : 'Arrival time',
      value: transport.arrival_time
    });
  }

  return details;
}

export function DepartureCard({ locale, tripId, departureCity, startDate, departureTransport }: DepartureCardProps) {
  const tTrips = useTranslations('trips');
  const tTransport = useTranslations('transport');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localDepartureTransport, setLocalDepartureTransport] = useState<Transport | null>(departureTransport);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalDepartureTransport(departureTransport);
  }, [departureTransport]);

  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const formattedStartDate = startDate ? formatDate(startDate, localeTag) : null;
  const hasTransport = hasTransportContent(localDepartureTransport);
  const travelDays = localDepartureTransport?.travel_days ?? 0;
  const TransportIcon = getTransportIconByType(localDepartureTransport?.transport_type);
  const transportDetails = getTransportDetails(localDepartureTransport, locale);

  const handleSave = (payload: DepartureTransportSubmitInput) => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const updatedTransport = await updateDepartureTransportAction({
          locale,
          tripId,
          transport: payload
        });

        setLocalDepartureTransport(updatedTransport);
        setIsModalOpen(false);
      } catch {
        setErrorMessage(
          locale === 'es'
            ? 'No se pudieron guardar los detalles de transporte de salida.'
            : 'Could not save departure transport details.'
        );
      }
    });
  };

  return (
    <>
      <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50/60 to-white shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{tTrips('departureFrom', { city: departureCity })}</h3>
              {formattedStartDate ? (
                <p className="mt-2 text-sm text-slate-600">{formattedStartDate}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">{locale === 'es' ? 'Sin fecha definida' : 'No date set'}</p>
              )}
            </div>

            <Button disabled={isPending} onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Edit2 className="mr-1.5 h-4 w-4" />
              {tTrips('editDeparture')}
            </Button>
          </div>

          {hasTransport ? (
            <div className="mt-4 rounded-lg bg-white/80 p-3">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-700">
                <TransportIcon className="h-4 w-4" />
                {tTransport('title')}
              </h4>

              <div className="space-y-1 text-sm text-slate-700">
                {transportDetails.map((field) => (
                  <p key={`departure-transport-${field.label}`}>
                    <span className="text-slate-500">{field.label}:</span> {field.value}
                  </p>
                ))}
              </div>

              {travelDays > 0 ? (
                <div className="mt-3">
                  <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                    {tTrips('travelDaysBadge', { count: travelDays })}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <DepartureTransportModal
        isPending={isPending}
        locale={locale}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
        open={isModalOpen}
        transport={localDepartureTransport}
        tripId={tripId}
      />
    </>
  );
}
