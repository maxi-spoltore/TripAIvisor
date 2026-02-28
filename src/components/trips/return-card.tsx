'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bus, Edit2, Plane, Train } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateReturnTransportAction } from '@/app/actions/trips';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/dates';
import type { Transport, TransportType } from '@/types/database';
import { ReturnTransportModal, type ReturnTransportSubmitInput } from './return-transport-modal';

type ReturnCardProps = {
  locale: string;
  tripId: number;
  returnCity: string;
  returnDate: string | null;
  returnTransport: Transport | null;
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
      transport.departure_time
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

  return details;
}

export function ReturnCard({ locale, tripId, returnCity, returnDate, returnTransport }: ReturnCardProps) {
  const tTrips = useTranslations('trips');
  const tTransport = useTranslations('transport');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localReturnTransport, setLocalReturnTransport] = useState<Transport | null>(returnTransport);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalReturnTransport(returnTransport);
  }, [returnTransport]);

  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const formattedReturnDate = returnDate ? formatDate(returnDate, localeTag) : null;
  const hasTransport = hasTransportContent(localReturnTransport);
  const TransportIcon = getTransportIconByType(localReturnTransport?.transport_type);
  const transportDetails = getTransportDetails(localReturnTransport, locale);

  const handleSave = (payload: ReturnTransportSubmitInput) => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const updatedTransport = await updateReturnTransportAction({
          locale,
          tripId,
          transport: payload
        });

        setLocalReturnTransport(updatedTransport);
        setIsModalOpen(false);
      } catch {
        setErrorMessage(
          locale === 'es'
            ? 'No se pudieron guardar los detalles de transporte del regreso.'
            : 'Could not save return transport details.'
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
              <h3 className="text-lg font-bold text-slate-900">
                {tTrips('endOfTrip')} - {returnCity}
              </h3>
              {formattedReturnDate ? (
                <p className="mt-2 text-sm text-slate-600">{formattedReturnDate}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">{locale === 'es' ? 'Sin fecha definida' : 'No date set'}</p>
              )}
            </div>

            <Button disabled={isPending} onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Edit2 className="mr-1.5 h-4 w-4" />
              {tTrips('editReturn')}
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
                  <p key={`return-transport-${field.label}`}>
                    <span className="text-slate-500">{field.label}:</span> {field.value}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <ReturnTransportModal
        isPending={isPending}
        locale={locale}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
        open={isModalOpen}
        transport={localReturnTransport}
        tripId={tripId}
      />
    </>
  );
}
