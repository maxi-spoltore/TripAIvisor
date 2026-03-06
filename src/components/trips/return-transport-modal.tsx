'use client';

import { useEffect, useState } from 'react';
import { Bus, Plane, Train } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Transport, TransportLeg, TransportType } from '@/types/database';

type ReturnTransportModalProps = {
  locale: string;
  tripId: number;
  transport: Transport | null;
  legs: TransportLeg[];
  previousDestinationHint: string | null;
  returnCityHint: string | null;
  open: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSave: (payload: ReturnTransportSubmitInput, legs: LegFormState[]) => void | Promise<void>;
};

export type ReturnTransportSubmitInput = {
  transport_type: TransportType;
  leave_accommodation_time: string | null;
  terminal: string | null;
  company: string | null;
  booking_number: string | null;
  booking_code: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  travel_days: number;
};

type ReturnTransportFormState = {
  transport_type: TransportType;
  leave_accommodation_time: string;
  terminal: string;
  company: string;
  booking_number: string;
  booking_code: string;
  departure_time: string;
  arrival_time: string;
  travel_days: string;
};

export type LegFormState = {
  origin_city: string;
  destination_city: string;
  company: string;
  booking_number: string;
  booking_code: string;
  departure_time: string;
  arrival_time: string;
  day_offset: string;
  terminal: string;
};

function toInputValue(value: string | null): string {
  return value ?? '';
}

function toNullable(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeCity(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function isCityMismatch(value: string, expected: string | null): boolean {
  if (!expected) {
    return false;
  }

  const currentCity = normalizeCity(value);
  const expectedCity = normalizeCity(expected);

  return currentCity !== '' && expectedCity !== '' && currentCity !== expectedCity;
}

function getTransportIcon(transportType: TransportType) {
  if (transportType === 'train') {
    return Train;
  }

  if (transportType === 'bus') {
    return Bus;
  }

  return Plane;
}

function getInitialState(transport: Transport | null): ReturnTransportFormState {
  return {
    transport_type: transport?.transport_type ?? 'plane',
    leave_accommodation_time: toInputValue(transport?.leave_accommodation_time ?? null),
    terminal: toInputValue(transport?.terminal ?? null),
    company: toInputValue(transport?.company ?? null),
    booking_number: toInputValue(transport?.booking_number ?? null),
    booking_code: toInputValue(transport?.booking_code ?? null),
    departure_time: toInputValue(transport?.departure_time ?? null),
    arrival_time: toInputValue(transport?.arrival_time ?? null),
    travel_days: String(transport?.travel_days ?? 0)
  };
}

function legToFormState(leg: TransportLeg): LegFormState {
  return {
    origin_city: leg.origin_city ?? '',
    destination_city: leg.destination_city ?? '',
    company: leg.company ?? '',
    booking_number: leg.booking_number ?? '',
    booking_code: leg.booking_code ?? '',
    departure_time: leg.departure_time ?? '',
    arrival_time: leg.arrival_time ?? '',
    day_offset: String(leg.day_offset),
    terminal: leg.terminal ?? ''
  };
}

function emptyLeg(previousLeg?: LegFormState): LegFormState {
  return {
    origin_city: previousLeg?.destination_city ?? '',
    destination_city: '',
    company: '',
    booking_number: '',
    booking_code: '',
    departure_time: '',
    arrival_time: '',
    day_offset: '0',
    terminal: ''
  };
}

export function ReturnTransportModal({
  locale,
  tripId,
  transport,
  legs,
  previousDestinationHint,
  returnCityHint,
  open,
  isPending,
  onCancel,
  onSave
}: ReturnTransportModalProps) {
  const tCommon = useTranslations('common');
  const tTransport = useTranslations('transport');
  const tTrips = useTranslations('trips');
  const [formState, setFormState] = useState<ReturnTransportFormState>(() => getInitialState(transport));
  const [legForms, setLegForms] = useState<LegFormState[]>(() => legs.map(legToFormState));

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState(getInitialState(transport));
    setLegForms(legs.map(legToFormState));
  }, [transport, legs, open]);

  const transportLabel = tTransport(formState.transport_type);
  const TransportIcon = getTransportIcon(formState.transport_type);

  const handleAddLeg = () => {
    setLegForms((previousLegs) => {
      if (previousLegs.length === 0) {
        return [
          {
            ...emptyLeg(),
            company: formState.company,
            booking_number: formState.booking_number,
            booking_code: formState.booking_code,
            departure_time: formState.departure_time,
            arrival_time: formState.arrival_time,
            terminal: formState.terminal
          }
        ];
      }

      return [...previousLegs, emptyLeg(previousLegs[previousLegs.length - 1])];
    });
  };

  const handleRemoveLeg = (index: number) => {
    setLegForms((previousLegs) => previousLegs.filter((_, legIndex) => legIndex !== index));
  };

  const handleLegChange = (index: number, field: keyof LegFormState, value: string) => {
    setLegForms((previousLegs) =>
      previousLegs.map((leg, legIndex) =>
        legIndex === index
          ? {
              ...leg,
              [field]: value
            }
          : leg
      )
    );
  };

  const handleRevertToSingle = () => {
    if (legForms.length !== 1) {
      return;
    }

    const leg = legForms[0];

    setFormState((previousState) => ({
      ...previousState,
      company: leg.company,
      booking_number: leg.booking_number,
      booking_code: leg.booking_code,
      departure_time: leg.departure_time,
      arrival_time: leg.arrival_time,
      terminal: leg.terminal
    }));
    setLegForms([]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTravelDays = Math.max(0, Math.trunc(Number(formState.travel_days) || 0));

    let payload: ReturnTransportSubmitInput = {
      transport_type: formState.transport_type,
      leave_accommodation_time: toNullable(formState.leave_accommodation_time),
      terminal: toNullable(formState.terminal),
      company: toNullable(formState.company),
      booking_number: toNullable(formState.booking_number),
      booking_code: toNullable(formState.booking_code),
      departure_time: toNullable(formState.departure_time),
      arrival_time: toNullable(formState.arrival_time),
      travel_days: parsedTravelDays
    };

    let nextLegs = legForms;

    // A single leg is only an editing state. Persist as parent transport + zero legs.
    if (nextLegs.length === 1) {
      const [onlyLeg] = nextLegs;

      payload = {
        ...payload,
        terminal: toNullable(onlyLeg.terminal),
        company: toNullable(onlyLeg.company),
        booking_number: toNullable(onlyLeg.booking_number),
        booking_code: toNullable(onlyLeg.booking_code),
        departure_time: toNullable(onlyLeg.departure_time),
        arrival_time: toNullable(onlyLeg.arrival_time)
      };
      nextLegs = [];
    }

    void onSave(payload, nextLegs);
  };

  const firstLeg = legForms[0] ?? null;
  const lastLeg = legForms.length > 0 ? legForms[legForms.length - 1] : null;
  const previousDestinationMismatch = firstLeg
    ? isCityMismatch(firstLeg.origin_city, previousDestinationHint)
    : false;
  const returnCityMismatch = lastLeg ? isCityMismatch(lastLeg.destination_city, returnCityHint) : false;

  const originCityLabel = locale === 'es' ? 'Ciudad de origen' : 'Origin city';
  const destinationCityLabel = locale === 'es' ? 'Ciudad de destino' : 'Destination city';
  const dayOffsetLabel = locale === 'es' ? 'Día de llegada (+N)' : 'Arrival day offset (+N)';

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          onCancel();
        }
      }}
      open={open}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto max-sm:h-screen max-sm:max-h-screen max-sm:rounded-none">
        <DialogHeader>
          <DialogTitle>{tTrips('editReturn')}</DialogTitle>
          <DialogDescription>
            {locale === 'es'
              ? `Actualiza los detalles de transporte para el viaje #${tripId}.`
              : `Update transport details for trip #${tripId}.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border bg-subtle p-4">
            <h3 className="mb-3 text-sm font-semibold text-brand-primary">{tTransport('title')}</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{tTransport('type')}</Label>
                <Select
                  onValueChange={(value) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      transport_type: value as TransportType
                    }))
                  }
                  value={formState.transport_type}
                >
                  <SelectTrigger>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <TransportIcon className="h-4 w-4 text-brand-primary" />
                      {transportLabel}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plane">{tTransport('plane')}</SelectItem>
                    <SelectItem value="train">{tTransport('train')}</SelectItem>
                    <SelectItem value="bus">{tTransport('bus')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>{tTransport('leaveTime')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      leave_accommodation_time: event.target.value
                    }))
                  }
                  type="time"
                  value={formState.leave_accommodation_time}
                />
              </div>

              <div className="space-y-1">
                <Label>{tTransport('terminal')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      terminal: event.target.value
                    }))
                  }
                  value={formState.terminal}
                />
              </div>

              <div className="space-y-1">
                <Label>{tTransport('company')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      company: event.target.value
                    }))
                  }
                  value={formState.company}
                />
              </div>

              <div className="space-y-1">
                <Label>{tTransport('bookingNumber')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      booking_number: event.target.value
                    }))
                  }
                  value={formState.booking_number}
                />
              </div>

              <div className="space-y-1">
                <Label>{tTransport('bookingCode')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      booking_code: event.target.value
                    }))
                  }
                  value={formState.booking_code}
                />
              </div>

              <div className="space-y-1">
                <Label>{tTransport('departureTime')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      departure_time: event.target.value
                    }))
                  }
                  type="time"
                  value={formState.departure_time}
                />
              </div>

              <div className="space-y-1">
                <Label>{tTransport('arrivalTime')}</Label>
                <Input
                  disabled={isPending}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      arrival_time: event.target.value
                    }))
                  }
                  type="time"
                  value={formState.arrival_time}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>{tTransport('travelDays')}</Label>
                <Input
                  disabled={isPending}
                  min={0}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      travel_days: event.target.value
                    }))
                  }
                  type="number"
                  value={formState.travel_days}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground-primary">{tTransport('flightItinerary')}</h3>

            {legForms.length === 0 ? (
              <Button disabled={isPending} onClick={handleAddLeg} type="button" variant="outline">
                {tTransport('addLeg')}
              </Button>
            ) : (
              <div className="space-y-3">
                {legForms.map((leg, index) => (
                  <div className="rounded-lg border border-border bg-subtle p-3" key={`leg-form-${index}`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-foreground-primary">{tTransport('legN', { n: index + 1 })}</h4>
                      <Button
                        disabled={isPending || legForms.length === 1}
                        onClick={() => handleRemoveLeg(index)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {tTransport('removeLeg')}
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>{originCityLabel}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'origin_city', event.target.value)}
                          value={leg.origin_city}
                        />
                        {index === 0 && previousDestinationMismatch ? (
                          <p className="text-xs text-warning">{tTransport('previousDestinationHint')}</p>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <Label>{destinationCityLabel}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'destination_city', event.target.value)}
                          value={leg.destination_city}
                        />
                        {index === legForms.length - 1 && returnCityMismatch ? (
                          <p className="text-xs text-warning">{tTransport('returnCityHint')}</p>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <Label>{tTransport('company')}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'company', event.target.value)}
                          value={leg.company}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>{tTransport('terminal')}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'terminal', event.target.value)}
                          value={leg.terminal}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>{tTransport('bookingNumber')}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'booking_number', event.target.value)}
                          value={leg.booking_number}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>{tTransport('bookingCode')}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'booking_code', event.target.value)}
                          value={leg.booking_code}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>{tTransport('departureTime')}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'departure_time', event.target.value)}
                          type="time"
                          value={leg.departure_time}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>{tTransport('arrivalTime')}</Label>
                        <Input
                          disabled={isPending}
                          onChange={(event) => handleLegChange(index, 'arrival_time', event.target.value)}
                          type="time"
                          value={leg.arrival_time}
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label>{dayOffsetLabel}</Label>
                        <Input
                          disabled={isPending}
                          min={0}
                          onChange={(event) => handleLegChange(index, 'day_offset', event.target.value)}
                          type="number"
                          value={leg.day_offset}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-2">
                  <Button disabled={isPending} onClick={handleAddLeg} type="button" variant="outline">
                    {tTransport('addLeg')}
                  </Button>

                  {legForms.length === 1 ? (
                    <Button disabled={isPending} onClick={handleRevertToSingle} type="button" variant="ghost">
                      {tTransport('revertToSingle')}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
              {tCommon('cancel')}
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  {locale === 'es' ? 'Guardando...' : 'Saving...'}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
