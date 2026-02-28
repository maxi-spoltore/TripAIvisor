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
import type { Transport, TransportType } from '@/types/database';

type ReturnTransportModalProps = {
  locale: string;
  tripId: number;
  transport: Transport | null;
  open: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSave: (payload: ReturnTransportSubmitInput) => void | Promise<void>;
};

export type ReturnTransportSubmitInput = {
  transport_type: TransportType;
  leave_accommodation_time: string | null;
  terminal: string | null;
  company: string | null;
  booking_number: string | null;
  booking_code: string | null;
  departure_time: string | null;
};

type ReturnTransportFormState = {
  transport_type: TransportType;
  leave_accommodation_time: string;
  terminal: string;
  company: string;
  booking_number: string;
  booking_code: string;
  departure_time: string;
};

function toInputValue(value: string | null): string {
  return value ?? '';
}

function toNullable(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
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
    departure_time: toInputValue(transport?.departure_time ?? null)
  };
}

export function ReturnTransportModal({
  locale,
  tripId,
  transport,
  open,
  isPending,
  onCancel,
  onSave
}: ReturnTransportModalProps) {
  const tCommon = useTranslations('common');
  const tTransport = useTranslations('transport');
  const tTrips = useTranslations('trips');
  const [formState, setFormState] = useState<ReturnTransportFormState>(() => getInitialState(transport));

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState(getInitialState(transport));
  }, [transport, open]);

  const transportLabel = tTransport(formState.transport_type);
  const TransportIcon = getTransportIcon(formState.transport_type);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void onSave({
      transport_type: formState.transport_type,
      leave_accommodation_time: toNullable(formState.leave_accommodation_time),
      terminal: toNullable(formState.terminal),
      company: toNullable(formState.company),
      booking_number: toNullable(formState.booking_number),
      booking_code: toNullable(formState.booking_code),
      departure_time: toNullable(formState.departure_time)
    });
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          onCancel();
        }
      }}
      open={open}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tTrips('editReturn')}</DialogTitle>
          <DialogDescription>
            {locale === 'es'
              ? `Actualiza los detalles de transporte para el viaje #${tripId}.`
              : `Update transport details for trip #${tripId}.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-primary-100 bg-primary-50/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-primary-700">{tTransport('title')}</h3>

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
                      <TransportIcon className="h-4 w-4 text-primary-600" />
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

              <div className="space-y-1 sm:col-span-2">
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
            </div>
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
