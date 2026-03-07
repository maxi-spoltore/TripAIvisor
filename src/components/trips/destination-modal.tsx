'use client';

import { useEffect, useState } from 'react';
import { Bus, ChevronDown, ChevronUp, Hotel, Plane, StickyNote, Train, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { DestinationWithRelations, TransportType } from '@/types/database';

type DestinationModalProps = {
  destination: DestinationWithRelations | null;
  open: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onSave: (payload: DestinationModalSubmitInput) => Promise<void> | void;
};

export type DestinationModalSubmitInput = {
  destinationId: number;
  city: string;
  duration: number;
  isStopover: boolean;
  notes: string | null;
  budget: number | null;
  transport: {
    transport_type: TransportType;
    leave_accommodation_time: string | null;
    terminal: string | null;
    company: string | null;
    booking_number: string | null;
    booking_code: string | null;
    departure_time: string | null;
  };
  accommodation: {
    check_in: string | null;
    check_out: string | null;
    name: string | null;
    booking_link: string | null;
    booking_code: string | null;
    address: string | null;
  };
};

type DestinationModalFormState = {
  city: string;
  duration: string;
  isStopover: boolean;
  notes: string;
  budget: string;
  transport: {
    transport_type: TransportType;
    leave_accommodation_time: string;
    terminal: string;
    company: string;
    booking_number: string;
    booking_code: string;
    departure_time: string;
  };
  accommodation: {
    check_in: string;
    check_out: string;
    name: string;
    booking_link: string;
    booking_code: string;
    address: string;
  };
};

function toInputValue(value: string | null): string {
  return value ?? '';
}

function toNullable(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function hasTransportContent(destination: DestinationWithRelations | null): boolean {
  if (!destination?.transport) {
    return false;
  }

  return Boolean(
    destination.transport.transport_type !== 'plane' ||
      destination.transport.leave_accommodation_time ||
      destination.transport.terminal ||
      destination.transport.company ||
      destination.transport.booking_number ||
      destination.transport.booking_code ||
      destination.transport.departure_time
  );
}

function hasAccommodationContent(destination: DestinationWithRelations | null): boolean {
  if (!destination?.accommodation) {
    return false;
  }

  return Boolean(
    destination.accommodation.check_in ||
      destination.accommodation.check_out ||
      destination.accommodation.name ||
      destination.accommodation.booking_link ||
      destination.accommodation.booking_code ||
      destination.accommodation.address
  );
}

function getTransportLabel(value: TransportType, tTransport: (key: 'plane' | 'train' | 'bus') => string): string {
  return tTransport(value);
}

function getTransportIcon(value: TransportType) {
  if (value === 'train') {
    return Train;
  }

  if (value === 'bus') {
    return Bus;
  }

  return Plane;
}

export function DestinationModal({
  destination,
  open,
  isPending = false,
  onCancel,
  onSave
}: DestinationModalProps) {
  const tCommon = useTranslations('common');
  const tDestinations = useTranslations('destinations');
  const tTransport = useTranslations('transport');
  const tAccommodation = useTranslations('accommodation');
  const tErrors = useTranslations('errors');
  const [formState, setFormState] = useState<DestinationModalFormState | null>(null);
  const [showTransport, setShowTransport] = useState(false);
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !destination) {
      setFormState(null);
      setErrorMessage(null);
      return;
    }

    setFormState({
      city: destination.city,
      duration: String(destination.duration),
      isStopover: destination.is_stopover,
      notes: destination.notes ?? '',
      budget: destination.budget === null ? '' : String(destination.budget),
      transport: {
        transport_type: destination.transport?.transport_type ?? 'plane',
        leave_accommodation_time: toInputValue(destination.transport?.leave_accommodation_time ?? null),
        terminal: toInputValue(destination.transport?.terminal ?? null),
        company: toInputValue(destination.transport?.company ?? null),
        booking_number: toInputValue(destination.transport?.booking_number ?? null),
        booking_code: toInputValue(destination.transport?.booking_code ?? null),
        departure_time: toInputValue(destination.transport?.departure_time ?? null)
      },
      accommodation: {
        check_in: toInputValue(destination.accommodation?.check_in ?? null),
        check_out: toInputValue(destination.accommodation?.check_out ?? null),
        name: toInputValue(destination.accommodation?.name ?? null),
        booking_link: toInputValue(destination.accommodation?.booking_link ?? null),
        booking_code: toInputValue(destination.accommodation?.booking_code ?? null),
        address: toInputValue(destination.accommodation?.address ?? null)
      }
    });
    setShowTransport(hasTransportContent(destination));
    setShowAccommodation(hasAccommodationContent(destination));
    setShowAdditional(Boolean(destination.notes || destination.budget !== null));
    setErrorMessage(null);
  }, [destination, open]);

  if (!destination || !formState) {
    return null;
  }

  const TransportIcon = getTransportIcon(formState.transport.transport_type);

  const handleSubmit = () => {
    const city = formState.city.trim();
    if (!city) {
      setErrorMessage(tErrors('cityNameRequired'));
      return;
    }

    const duration = Number(formState.duration);
    if (!Number.isFinite(duration) || (!formState.isStopover && duration < 1) || duration < 0) {
      setErrorMessage(tErrors('durationInvalid'));
      return;
    }

    const normalizedBudget = formState.budget.trim();
    const budget = normalizedBudget ? Number(normalizedBudget) : null;
    if (normalizedBudget && !Number.isFinite(budget)) {
      setErrorMessage(tErrors('budgetInvalid'));
      return;
    }

    setErrorMessage(null);

    void onSave({
      destinationId: destination.destination_id,
      city,
      duration: Math.trunc(duration),
      isStopover: formState.isStopover,
      notes: toNullable(formState.notes),
      budget,
      transport: {
        transport_type: formState.transport.transport_type,
        leave_accommodation_time: toNullable(formState.transport.leave_accommodation_time),
        terminal: toNullable(formState.transport.terminal),
        company: toNullable(formState.transport.company),
        booking_number: toNullable(formState.transport.booking_number),
        booking_code: toNullable(formState.transport.booking_code),
        departure_time: toNullable(formState.transport.departure_time)
      },
      accommodation: {
        check_in: toNullable(formState.accommodation.check_in),
        check_out: toNullable(formState.accommodation.check_out),
        name: toNullable(formState.accommodation.name),
        booking_link: toNullable(formState.accommodation.booking_link),
        booking_code: toNullable(formState.accommodation.booking_code),
        address: toNullable(formState.accommodation.address)
      }
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
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-0 max-sm:h-screen max-sm:max-h-screen max-sm:rounded-none">
        <DialogHeader className="mb-0 flex-row items-center justify-between gap-3 border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-bold">
            {tCommon('edit')} — {formState.city || tDestinations('fallbackDestination')}
          </DialogTitle>
          <button
            aria-label={tCommon('close')}
            type="button"
            className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-subtle hover:text-foreground-secondary"
            onClick={() => {
              if (!isPending) {
                onCancel();
              }
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                checked={formState.isStopover}
                className="h-4 w-4 rounded border-border text-brand-primary"
                disabled={isPending}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setFormState((previous) =>
                    previous
                      ? {
                          ...previous,
                          isStopover: checked,
                          duration: checked ? '0' : previous.duration === '0' ? '2' : previous.duration
                        }
                      : previous
                  );
                }}
                type="checkbox"
              />
              <Label>{tDestinations('stopover')}</Label>
            </div>
            <div className="space-y-1">
              <Label>{tDestinations('city')} *</Label>
              <Input
                disabled={isPending}
                onChange={(event) =>
                  setFormState((previous) =>
                    previous
                      ? {
                          ...previous,
                          city: event.target.value
                        }
                      : previous
                  )
                }
                placeholder={tDestinations('cityPlaceholder')}
                value={formState.city}
              />
            </div>
            {!formState.isStopover ? (
              <div className="space-y-1">
                <Label>{tDestinations('duration')} *</Label>
                <Input
                  disabled={isPending}
                  min={1}
                  onChange={(event) =>
                    setFormState((previous) =>
                      previous
                        ? {
                            ...previous,
                            duration: event.target.value
                          }
                        : previous
                    )
                  }
                  type="number"
                  value={formState.duration}
                />
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              'rounded-xl border p-4 transition-colors',
              showTransport ? 'border-brand-primary bg-subtle' : 'border-border'
            )}
          >
            <button
              className="flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => setShowTransport((previous) => !previous)}
              type="button"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground-primary">
                <TransportIcon className="h-4 w-4 text-brand-primary" />
                {tTransport('title')}
              </span>
              {showTransport ? (
                <ChevronUp className="h-4 w-4 text-foreground-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground-muted" />
              )}
            </button>

            {showTransport ? (
              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <Label>{tTransport('type')}</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                transport_type: value as TransportType
                              }
                            }
                          : previous
                      )
                    }
                    value={formState.transport.transport_type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plane">{getTransportLabel('plane', tTransport)}</SelectItem>
                      <SelectItem value="train">{getTransportLabel('train', tTransport)}</SelectItem>
                      <SelectItem value="bus">{getTransportLabel('bus', tTransport)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{tTransport('leaveTime')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                leave_accommodation_time: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    type="time"
                    value={formState.transport.leave_accommodation_time}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tTransport('terminal')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                terminal: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    placeholder={tTransport('terminalPlaceholder')}
                    value={formState.transport.terminal}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tTransport('company')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                company: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    placeholder={tTransport('companyPlaceholder')}
                    value={formState.transport.company}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tTransport('bookingNumber')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                booking_number: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    value={formState.transport.booking_number}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tTransport('bookingCode')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                booking_code: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    value={formState.transport.booking_code}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tTransport('departureTime')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              transport: {
                                ...previous.transport,
                                departure_time: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    type="time"
                    value={formState.transport.departure_time}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              'rounded-xl border p-4 transition-colors',
              showAccommodation ? 'border-warning bg-subtle' : 'border-border'
            )}
          >
            <button
              className="flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => setShowAccommodation((previous) => !previous)}
              type="button"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground-primary">
                <Hotel className="h-4 w-4 text-warning" />
                {tAccommodation('title')}
              </span>
              {showAccommodation ? (
                <ChevronUp className="h-4 w-4 text-foreground-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground-muted" />
              )}
            </button>

            {showAccommodation ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>{tAccommodation('checkIn')}</Label>
                    <Input
                      disabled={isPending}
                      onChange={(event) =>
                        setFormState((previous) =>
                          previous
                            ? {
                                ...previous,
                                accommodation: {
                                  ...previous.accommodation,
                                  check_in: event.target.value
                                }
                              }
                            : previous
                        )
                      }
                      type="time"
                      value={formState.accommodation.check_in}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tAccommodation('checkOut')}</Label>
                    <Input
                      disabled={isPending}
                      onChange={(event) =>
                        setFormState((previous) =>
                          previous
                            ? {
                                ...previous,
                                accommodation: {
                                  ...previous.accommodation,
                                  check_out: event.target.value
                                }
                              }
                            : previous
                        )
                      }
                      type="time"
                      value={formState.accommodation.check_out}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>{tAccommodation('name')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              accommodation: {
                                ...previous.accommodation,
                                name: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    placeholder={tAccommodation('namePlaceholder')}
                    value={formState.accommodation.name}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tAccommodation('bookingLink')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              accommodation: {
                                ...previous.accommodation,
                                booking_link: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    placeholder="https://..."
                    value={formState.accommodation.booking_link}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tAccommodation('bookingCode')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              accommodation: {
                                ...previous.accommodation,
                                booking_code: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    value={formState.accommodation.booking_code}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tAccommodation('address')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              accommodation: {
                                ...previous.accommodation,
                                address: event.target.value
                              }
                            }
                          : previous
                      )
                    }
                    placeholder={tAccommodation('addressPlaceholder')}
                    value={formState.accommodation.address}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              'rounded-xl border p-4 transition-colors',
              showAdditional ? 'border-border bg-subtle' : 'border-border'
            )}
          >
            <button
              className="flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => setShowAdditional((previous) => !previous)}
              type="button"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground-primary">
                <StickyNote className="h-4 w-4 text-foreground-muted" />
                {tDestinations('additional')}
              </span>
              {showAdditional ? (
                <ChevronUp className="h-4 w-4 text-foreground-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground-muted" />
              )}
            </button>

            {showAdditional ? (
              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <Label>{tDestinations('notes')}</Label>
                  <Textarea
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              notes: event.target.value
                            }
                          : previous
                      )
                    }
                    placeholder={tDestinations('notesPlaceholder')}
                    rows={3}
                    value={formState.notes}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tDestinations('budget')}</Label>
                  <Input
                    disabled={isPending}
                    onChange={(event) =>
                      setFormState((previous) =>
                        previous
                          ? {
                              ...previous,
                              budget: event.target.value
                            }
                          : previous
                      )
                    }
                    placeholder={tDestinations('budgetPlaceholder')}
                    type="number"
                    value={formState.budget}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}
        </div>

        <DialogFooter className="sticky bottom-0 mt-0 flex-row gap-3 border-t border-border bg-surface p-4 sm:justify-start">
          <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {tCommon('saving')}
              </>
            ) : (
              tCommon('save')
            )}
          </Button>
          <Button className="flex-1" disabled={isPending} onClick={onCancel} variant="outline">
            {tCommon('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
