'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bus, ChevronDown, ChevronUp, Edit2, Plane, Train } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateReturnTransportAction, updateTransportLegsAction } from '@/app/actions/trips';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dates';
import { computeLayoverMinutes, computeTotalJourneyMinutes, formatDuration } from '@/lib/utils/transport';
import type { Transport, TransportLeg, TransportLegInput, TransportType, TransportWithLegs } from '@/types/database';
import { ReturnTransportModal, type LegFormState, type ReturnTransportSubmitInput } from './return-transport-modal';

type ReturnCardProps = {
  locale: string;
  tripId: number;
  returnCity: string;
  returnDate: string | null;
  returnTransport: TransportWithLegs | null;
  previousDestinationCity: string | null;
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

function getTransportLabel(transportType: TransportType, tTransport: (key: string) => string): string {
  return tTransport(transportType);
}

function getTransportDetails(transport: Transport | null, tTransport: (key: string) => string): LabelValue[] {
  if (!transport || !hasTransportContent(transport)) {
    return [];
  }

  const details: LabelValue[] = [];

  if (transport.transport_type && transport.transport_type !== 'plane') {
    details.push({
      label: tTransport('type'),
      value: getTransportLabel(transport.transport_type, tTransport)
    });
  }

  if (transport.leave_accommodation_time) {
    details.push({
      label: tTransport('leaveTime'),
      value: transport.leave_accommodation_time
    });
  }

  if (transport.terminal) {
    details.push({
      label: tTransport('terminal'),
      value: transport.terminal
    });
  }

  if (transport.company) {
    details.push({
      label: tTransport('company'),
      value: transport.company
    });
  }

  const reservation = [transport.booking_number, transport.booking_code].filter(Boolean).join(' / ');
  if (reservation) {
    details.push({
      label: tTransport('reservation'),
      value: reservation
    });
  }

  if (transport.departure_time) {
    details.push({
      label: tTransport('departureTime'),
      value: transport.departure_time
    });
  }

  if (transport.arrival_time) {
    details.push({
      label: tTransport('arrivalTime'),
      value: transport.arrival_time
    });
  }

  return details;
}

function toNullable(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toLegInput(leg: LegFormState): TransportLegInput {
  return {
    origin_city: toNullable(leg.origin_city),
    destination_city: toNullable(leg.destination_city),
    company: toNullable(leg.company),
    booking_number: toNullable(leg.booking_number),
    booking_code: toNullable(leg.booking_code),
    departure_time: toNullable(leg.departure_time),
    arrival_time: toNullable(leg.arrival_time),
    day_offset: Math.max(0, Math.trunc(Number(leg.day_offset) || 0)),
    terminal: toNullable(leg.terminal)
  };
}

export function ReturnCard({
  locale,
  tripId,
  returnCity,
  returnDate,
  returnTransport,
  previousDestinationCity
}: ReturnCardProps) {
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const tTrips = useTranslations('trips');
  const tTransport = useTranslations('transport');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localReturnTransport, setLocalReturnTransport] = useState<Transport | null>(returnTransport);
  const [localLegs, setLocalLegs] = useState<TransportLeg[]>(returnTransport?.legs ?? []);
  const [isLegsCollapsed, setIsLegsCollapsed] = useState((returnTransport?.legs.length ?? 0) >= 3);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalReturnTransport(returnTransport);
    setLocalLegs(returnTransport?.legs ?? []);
    setIsLegsCollapsed((returnTransport?.legs.length ?? 0) >= 3);
  }, [returnTransport]);

  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const formattedReturnDate = returnDate ? formatDate(returnDate, localeTag) : null;
  const sortedLegs = [...localLegs].sort((a, b) => a.position - b.position);
  const hasLegsItinerary = sortedLegs.length >= 2;
  const hasTransport = hasLegsItinerary || hasTransportContent(localReturnTransport);
  const travelDays = localReturnTransport?.travel_days ?? 0;
  const TransportIcon = getTransportIconByType(localReturnTransport?.transport_type);
  const transportDetails = getTransportDetails(localReturnTransport, tTransport);
  const totalJourneyMinutes = hasLegsItinerary ? computeTotalJourneyMinutes(sortedLegs) : null;

  const handleSave = (payload: ReturnTransportSubmitInput, legForms: LegFormState[]) => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        let normalizedPayload = payload;
        let legInputs = legForms.map(toLegInput);

        // Persisting a single leg is not allowed; fold it back to parent fields.
        if (legInputs.length === 1) {
          const [onlyLeg] = legInputs;
          normalizedPayload = {
            ...normalizedPayload,
            terminal: onlyLeg.terminal,
            company: onlyLeg.company,
            booking_number: onlyLeg.booking_number,
            booking_code: onlyLeg.booking_code,
            departure_time: onlyLeg.departure_time,
            arrival_time: onlyLeg.arrival_time
          };
          legInputs = [];
        }

        const updatedTransport = await updateReturnTransportAction({
          locale,
          tripId,
          transport: normalizedPayload
        });

        const savedLegs = await updateTransportLegsAction({
          locale,
          tripId,
          transportId: updatedTransport.transport_id,
          legs: legInputs
        });

        setLocalReturnTransport(updatedTransport);
        setLocalLegs(savedLegs.length >= 2 ? savedLegs : []);
        setIsLegsCollapsed(savedLegs.length >= 3);
        setIsModalOpen(false);
      } catch {
        setErrorMessage(tErrors('saveReturnTransport'));
      }
    });
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-surface shadow-card">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground-primary">
                {tTrips('endOfTrip')} - {returnCity}
              </h3>
              {formattedReturnDate ? (
                <p className="mt-2 text-sm text-foreground-secondary">{formattedReturnDate}</p>
              ) : (
                <p className="mt-2 text-sm text-foreground-muted">{tCommon('noDateSet')}</p>
              )}
            </div>

            <Button disabled={isPending} onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Edit2 className="mr-1.5 h-4 w-4" />
              {tTrips('editReturn')}
            </Button>
          </div>

          {hasTransport ? (
            <div className="mt-4 border-t border-border pt-4">
              {hasLegsItinerary ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-primary">
                      <Plane className="h-4 w-4" />
                      {tTransport('flightItinerary')} · {sortedLegs.length}
                    </h4>

                    {sortedLegs.length >= 3 ? (
                      <Button
                        className="h-7 px-2"
                        disabled={isPending}
                        onClick={() => setIsLegsCollapsed((previousState) => !previousState)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {isLegsCollapsed ? tCommon('expand') : tCommon('collapse')}
                        {isLegsCollapsed ? (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    ) : null}
                  </div>

                  {!isLegsCollapsed || sortedLegs.length < 3 ? (
                    <div className="mt-3 space-y-3 text-sm text-foreground-secondary">
                      {sortedLegs.map((leg, index) => {
                        const nextLeg = sortedLegs[index + 1] ?? null;
                        const reservation = [leg.booking_number, leg.booking_code].filter(Boolean).join('/');
                        const companyLine = [leg.company, reservation].filter(Boolean).join(' ');
                        const detailLine = [
                          companyLine || null,
                          leg.terminal ? `${tTransport('terminal')} ${leg.terminal}` : null
                        ]
                          .filter(Boolean)
                          .join(' | ');
                        const timeLine = [
                          leg.departure_time ? `${tTransport('departs')} ${leg.departure_time}` : null,
                          leg.arrival_time
                            ? `${tTransport('arrives')} ${leg.arrival_time}${
                                leg.day_offset > 0 ? ` (${tTransport('dayOffset', { n: leg.day_offset })})` : ''
                              }`
                            : null
                        ]
                          .filter(Boolean)
                          .join(' · ');

                        let layoverMinutes: number | null = null;

                        if (nextLeg && leg.arrival_time && nextLeg.departure_time) {
                          const computedLayover = computeLayoverMinutes(
                            leg.arrival_time,
                            leg.day_offset,
                            nextLeg.departure_time,
                            nextLeg.day_offset
                          );
                          layoverMinutes = computedLayover >= 0 ? computedLayover : null;
                        }

                        return (
                          <div key={`return-leg-${leg.leg_id}`}>
                            <p className="font-medium text-foreground-primary">{tTransport('legN', { n: index + 1 })}</p>
                            <p>
                              {(leg.origin_city ?? '-') + ' -> ' + (leg.destination_city ?? '-')}
                            </p>
                            {detailLine ? <p className="text-foreground-secondary">{detailLine}</p> : null}
                            {timeLine ? <p className="text-foreground-secondary">{timeLine}</p> : null}

                            {layoverMinutes !== null ? (
                              <p
                                className={cn(
                                  'my-2 text-center text-xs font-medium text-foreground-muted',
                                  layoverMinutes < 60 ? 'text-warning' : null
                                )}
                              >
                                -- {tTransport('connection', { duration: formatDuration(layoverMinutes) })} --
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {typeof totalJourneyMinutes === 'number' && totalJourneyMinutes >= 0 ? (
                    <p className="mt-3 text-sm font-medium text-foreground-secondary">
                      {tTransport('totalJourney', { duration: formatDuration(totalJourneyMinutes) })}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-primary">
                    <TransportIcon className="h-4 w-4" />
                    {tTransport('title')}
                  </h4>

                  <div className="space-y-1 text-sm text-foreground-secondary">
                    {transportDetails.map((field) => (
                      <p key={`return-transport-${field.label}`}>
                        <span className="text-foreground-muted">{field.label}:</span> {field.value}
                      </p>
                    ))}
                  </div>

                  {travelDays > 0 ? (
                    <div className="mt-3">
                      <span className="inline-flex rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
                        {tTrips('travelDaysBadge', { count: travelDays })}
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <ReturnTransportModal
        isPending={isPending}
        legs={localLegs}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
        open={isModalOpen}
        previousDestinationHint={previousDestinationCity}
        returnCityHint={returnCity}
        transport={localReturnTransport}
        tripId={tripId}
      />
    </>
  );
}
