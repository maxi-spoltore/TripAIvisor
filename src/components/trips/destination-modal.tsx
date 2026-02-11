'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bus, ChevronDown, ChevronUp, Hotel, Plane, StickyNote, Train } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DestinationWithRelations, TransportType } from '@/types/database';

type DestinationModalProps = {
  locale: string;
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

function getModalTitle(locale: string): string {
  return locale === 'es' ? 'Editar Destino' : 'Edit Destination';
}

function getTransportLabel(locale: string, value: TransportType): string {
  if (locale === 'es') {
    if (value === 'train') {
      return 'Tren';
    }

    if (value === 'bus') {
      return 'Bus';
    }

    return 'Avión';
  }

  if (value === 'train') {
    return 'Train';
  }

  if (value === 'bus') {
    return 'Bus';
  }

  return 'Plane';
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
  locale,
  destination,
  open,
  isPending = false,
  onCancel,
  onSave
}: DestinationModalProps) {
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

  const strings = useMemo(
    () => ({
      cityLabel: locale === 'es' ? 'Ciudad *' : 'City *',
      cityPlaceholder: locale === 'es' ? 'Ej: Madrid' : 'Ex: Madrid',
      durationLabel: locale === 'es' ? 'Duración (días) *' : 'Duration (days) *',
      transportTitle: locale === 'es' ? 'Transporte' : 'Transport',
      accommodationTitle: locale === 'es' ? 'Hospedaje' : 'Accommodation',
      additionalTitle: locale === 'es' ? 'Adicionales' : 'Additional',
      transportTypeLabel: locale === 'es' ? 'Tipo de transporte' : 'Transport type',
      leaveTimeLabel: locale === 'es' ? 'Hora salida del alojamiento' : 'Leave accommodation time',
      terminalLabel: locale === 'es' ? 'Terminal de origen' : 'Departure terminal',
      terminalPlaceholder: locale === 'es' ? 'Ej: Aeropuerto Barajas - T4' : 'Ex: Barajas Airport - T4',
      companyLabel: locale === 'es' ? 'Empresa' : 'Company',
      companyPlaceholder: locale === 'es' ? 'Ej: Iberia, Renfe, Alsa' : 'Ex: Iberia, Renfe, Alsa',
      bookingNumberLabel: locale === 'es' ? 'Número de boleto' : 'Ticket number',
      bookingCodeLabel: locale === 'es' ? 'Código de reserva' : 'Booking code',
      departureTimeLabel: locale === 'es' ? 'Hora de salida del transporte' : 'Transport departure time',
      checkInLabel: locale === 'es' ? 'Check-in' : 'Check-in',
      checkOutLabel: locale === 'es' ? 'Check-out' : 'Check-out',
      accommodationNameLabel: locale === 'es' ? 'Nombre del alojamiento' : 'Accommodation name',
      accommodationNamePlaceholder: locale === 'es' ? 'Ej: Hotel Ejemplo' : 'Ex: Sample Hotel',
      bookingLinkLabel: locale === 'es' ? 'Link de reserva' : 'Booking link',
      bookingLinkPlaceholder: 'https://...',
      addressLabel: locale === 'es' ? 'Dirección' : 'Address',
      addressPlaceholder: locale === 'es' ? 'Calle, número, ciudad' : 'Street, number, city',
      notesLabel: locale === 'es' ? 'Notas' : 'Notes',
      notesPlaceholder:
        locale === 'es' ? 'Lugares para visitar, recordatorios, etc.' : 'Places to visit, reminders, etc.',
      budgetLabel: locale === 'es' ? 'Presupuesto estimado' : 'Estimated budget',
      budgetPlaceholder: '0',
      save: locale === 'es' ? 'Guardar' : 'Save',
      cancel: locale === 'es' ? 'Cancelar' : 'Cancel',
      cityRequired: locale === 'es' ? 'El nombre de la ciudad es obligatorio.' : 'City name is required.',
      durationInvalid:
        locale === 'es' ? 'La duración debe ser al menos 1 día.' : 'Duration must be at least 1 day.',
      budgetInvalid: locale === 'es' ? 'El presupuesto debe ser un número válido.' : 'Budget must be a valid number.'
    }),
    [locale]
  );

  if (!open || !destination || !formState) {
    return null;
  }

  const TransportIcon = getTransportIcon(formState.transport.transport_type);

  const handleSubmit = () => {
    const city = formState.city.trim();
    if (!city) {
      setErrorMessage(strings.cityRequired);
      return;
    }

    const duration = Number(formState.duration);
    if (!Number.isFinite(duration) || duration < 1) {
      setErrorMessage(strings.durationInvalid);
      return;
    }

    const normalizedBudget = formState.budget.trim();
    const budget = normalizedBudget ? Number(normalizedBudget) : null;
    if (normalizedBudget && !Number.isFinite(budget)) {
      setErrorMessage(strings.budgetInvalid);
      return;
    }

    setErrorMessage(null);

    void onSave({
      destinationId: destination.destination_id,
      city,
      duration: Math.trunc(duration),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!isPending) {
          onCancel();
        }
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold">{getModalTitle(locale)}</h2>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{strings.cityLabel}</Label>
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
                placeholder={strings.cityPlaceholder}
                value={formState.city}
              />
            </div>
            <div className="space-y-1">
              <Label>{strings.durationLabel}</Label>
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
          </div>

          <div className="space-y-4 rounded-md border border-slate-200 p-4">
            <Button
              className="h-auto w-full justify-between px-0 text-left"
              disabled={isPending}
              onClick={() => setShowTransport((previous) => !previous)}
              variant="ghost"
            >
              <span className="flex items-center gap-2 font-semibold">
                <TransportIcon className="h-4 w-4" />
                {strings.transportTitle}
              </span>
              {showTransport ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>

            {showTransport ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>{strings.transportTypeLabel}</Label>
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
                      <SelectItem value="plane">{getTransportLabel(locale, 'plane')}</SelectItem>
                      <SelectItem value="train">{getTransportLabel(locale, 'train')}</SelectItem>
                      <SelectItem value="bus">{getTransportLabel(locale, 'bus')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{strings.leaveTimeLabel}</Label>
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
                  <Label>{strings.terminalLabel}</Label>
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
                    placeholder={strings.terminalPlaceholder}
                    value={formState.transport.terminal}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{strings.companyLabel}</Label>
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
                    placeholder={strings.companyPlaceholder}
                    value={formState.transport.company}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{strings.bookingNumberLabel}</Label>
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
                  <Label>{strings.bookingCodeLabel}</Label>
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
                  <Label>{strings.departureTimeLabel}</Label>
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

          <div className="space-y-4 rounded-md border border-slate-200 p-4">
            <Button
              className="h-auto w-full justify-between px-0 text-left"
              disabled={isPending}
              onClick={() => setShowAccommodation((previous) => !previous)}
              variant="ghost"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Hotel className="h-4 w-4" />
                {strings.accommodationTitle}
              </span>
              {showAccommodation ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>

            {showAccommodation ? (
              <div className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>{strings.checkInLabel}</Label>
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
                    <Label>{strings.checkOutLabel}</Label>
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
                  <Label>{strings.accommodationNameLabel}</Label>
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
                    placeholder={strings.accommodationNamePlaceholder}
                    value={formState.accommodation.name}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{strings.bookingLinkLabel}</Label>
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
                    placeholder={strings.bookingLinkPlaceholder}
                    value={formState.accommodation.booking_link}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{strings.bookingCodeLabel}</Label>
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
                  <Label>{strings.addressLabel}</Label>
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
                    placeholder={strings.addressPlaceholder}
                    value={formState.accommodation.address}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-md border border-slate-200 p-4">
            <Button
              className="h-auto w-full justify-between px-0 text-left"
              disabled={isPending}
              onClick={() => setShowAdditional((previous) => !previous)}
              variant="ghost"
            >
              <span className="flex items-center gap-2 font-semibold">
                <StickyNote className="h-4 w-4" />
                {strings.additionalTitle}
              </span>
              {showAdditional ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>

            {showAdditional ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>{strings.notesLabel}</Label>
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
                    placeholder={strings.notesPlaceholder}
                    rows={3}
                    value={formState.notes}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{strings.budgetLabel}</Label>
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
                    placeholder={strings.budgetPlaceholder}
                    type="number"
                    value={formState.budget}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </div>

        <div className="flex gap-3 border-t border-slate-200 p-4">
          <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
            {strings.save}
          </Button>
          <Button className="flex-1" disabled={isPending} onClick={onCancel} variant="outline">
            {strings.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
