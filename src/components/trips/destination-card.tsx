import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit2,
  Hotel,
  MoreVertical,
  Plane,
  StickyNote,
  Trash2,
  Train,
  Bus
} from 'lucide-react';
import { formatDate, getDestinationDates } from '@/lib/utils/dates';
import type { Accommodation, DestinationWithRelations, Transport, TransportType } from '@/types/database';

type DestinationCardProps = {
  destination: DestinationWithRelations;
  destinations: DestinationWithRelations[];
  index: number;
  locale: string;
  startDate: string | null;
  expanded: boolean;
  openMenuId: number | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  setOpenMenuId: (destinationId: number | null) => void;
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

function hasAccommodationContent(accommodation: Accommodation | null): boolean {
  if (!accommodation) {
    return false;
  }

  return Boolean(
    accommodation.check_in ||
      accommodation.check_out ||
      accommodation.name ||
      accommodation.booking_link ||
      accommodation.booking_code ||
      accommodation.address
  );
}

function getTransportLabel(locale: string, type: TransportType): string {
  if (locale === 'es') {
    if (type === 'train') {
      return 'Tren';
    }

    if (type === 'bus') {
      return 'Bus';
    }

    return 'Avión';
  }

  if (type === 'train') {
    return 'Train';
  }

  if (type === 'bus') {
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

function getAccommodationDetails(accommodation: Accommodation | null, locale: string): LabelValue[] {
  if (!accommodation || !hasAccommodationContent(accommodation)) {
    return [];
  }

  const details: LabelValue[] = [];

  if (accommodation.check_in || accommodation.check_out) {
    details.push({
      label: locale === 'es' ? 'Horarios' : 'Schedule',
      value:
        locale === 'es'
          ? `Check-in: ${accommodation.check_in ?? '-'} | Check-out: ${accommodation.check_out ?? '-'}`
          : `Check-in: ${accommodation.check_in ?? '-'} | Check-out: ${accommodation.check_out ?? '-'}`
    });
  }

  if (accommodation.name) {
    details.push({
      label: locale === 'es' ? 'Nombre' : 'Name',
      value: accommodation.name
    });
  }

  const booking = accommodation.booking_code ?? accommodation.booking_link;
  if (booking) {
    details.push({
      label: locale === 'es' ? 'Reserva' : 'Booking',
      value: booking
    });
  }

  if (accommodation.address) {
    details.push({
      label: locale === 'es' ? 'Dirección' : 'Address',
      value: accommodation.address
    });
  }

  return details;
}

export function DestinationCard({
  destination,
  destinations,
  index,
  locale,
  startDate,
  expanded,
  openMenuId,
  onToggle,
  onEdit,
  onDelete,
  setOpenMenuId
}: DestinationCardProps) {
  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const { start, end } = getDestinationDates(startDate, destinations, index);
  const dateRange = start && end ? `${formatDate(start, localeTag)} - ${formatDate(end, localeTag)}` : null;
  const cardId = destination.destination_id;
  const menuId = `destination-actions-${cardId}`;
  const fallbackName = locale === 'es' ? 'Nueva Ciudad' : 'New City';
  const actionsLabel = locale === 'es' ? 'Acciones' : 'Actions';

  const hasTransport = hasTransportContent(destination.transport);
  const hasAccommodation = hasAccommodationContent(destination.accommodation);
  const TransportIcon = getTransportIconByType(destination.transport?.transport_type);

  const transportDetails = getTransportDetails(destination.transport, locale);
  const accommodationDetails = getAccommodationDetails(destination.accommodation, locale);
  const transportPreview = transportDetails.slice(0, 2);
  const accommodationPreview = accommodationDetails.slice(0, 2);
  const hasMoreContent =
    transportDetails.length > 2 ||
    accommodationDetails.length > 2 ||
    Boolean(destination.notes) ||
    destination.budget !== null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{destination.city || fallbackName}</h3>
              {hasTransport ? <TransportIcon aria-hidden="true" className="h-4 w-4 text-primary-500" /> : null}
              {hasAccommodation ? <Hotel aria-hidden="true" className="h-4 w-4 text-amber-500" /> : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {destination.duration} {locale === 'es' ? 'días' : 'days'}
              </span>
              {dateRange ? <span>{dateRange}</span> : null}
            </div>
          </div>

          <div className="destination-action-menu relative">
            <button
              aria-label={actionsLabel}
              aria-controls={openMenuId === cardId ? menuId : undefined}
              aria-expanded={openMenuId === cardId}
              aria-haspopup="true"
              className="rounded-lg p-2 transition-colors hover:bg-slate-100"
              onClick={(event) => {
                event.stopPropagation();
                setOpenMenuId(openMenuId === cardId ? null : cardId);
              }}
              type="button"
            >
              <MoreVertical className="h-5 w-5 text-slate-600" />
            </button>

            {openMenuId === cardId ? (
              <div
                className="absolute right-0 top-full z-10 mt-1 min-w-[150px] animate-fade-in rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                id={menuId}
                role="menu"
              >
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId(null);
                    onEdit();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Edit2 className="h-4 w-4" />
                  {locale === 'es' ? 'Editar' : 'Edit'}
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId(null);
                    onDelete();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  {locale === 'es' ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {!expanded ? (
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {transportPreview.length > 0 ? (
              <div className="space-y-1">
                {transportPreview.map((field) => (
                  <p key={`transport-${field.label}`}>
                    <span className="text-slate-500">{field.label}:</span> {field.value}
                  </p>
                ))}
              </div>
            ) : null}
            {accommodationPreview.length > 0 ? (
              <div className="space-y-1">
                {accommodationPreview.map((field) => (
                  <p key={`accommodation-${field.label}`}>
                    <span className="text-slate-500">{field.label}:</span> {field.value}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {hasMoreContent ? (
          <button
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            onClick={onToggle}
            type="button"
          >
            {expanded
              ? locale === 'es'
                ? 'Ocultar detalles'
                : 'Hide details'
              : locale === 'es'
                ? 'Ver detalles'
                : 'Show details'}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : null}

        {expanded ? (
          <div className="mt-4 space-y-3">
            {transportDetails.length > 0 ? (
              <div className="rounded-lg bg-primary-50/50 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-700">
                  <TransportIcon className="h-4 w-4" />
                  {locale === 'es' ? 'Transporte' : 'Transport'}
                </h4>
                <div className="space-y-1 text-sm text-slate-700">
                  {transportDetails.map((field) => (
                    <p key={`expanded-transport-${field.label}`}>
                      <span className="text-slate-500">{field.label}:</span> {field.value}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {accommodationDetails.length > 0 ? (
              <div className="rounded-lg bg-amber-50/50 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <Hotel className="h-4 w-4" />
                  {locale === 'es' ? 'Hospedaje' : 'Accommodation'}
                </h4>
                <div className="space-y-1 text-sm text-slate-700">
                  {accommodationDetails.map((field) => (
                    <p key={`expanded-accommodation-${field.label}`}>
                      <span className="text-slate-500">{field.label}:</span> {field.value}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {destination.notes ? (
              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <StickyNote className="h-4 w-4" />
                  {locale === 'es' ? 'Notas' : 'Notes'}
                </h4>
                <p className="text-sm text-slate-700">{destination.notes}</p>
              </div>
            ) : null}

            {destination.budget !== null ? (
              <div className="rounded-lg bg-emerald-50/50 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <DollarSign className="h-4 w-4" />
                  {locale === 'es' ? 'Presupuesto' : 'Budget'}
                </h4>
                <p className="text-sm text-slate-700">${destination.budget}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
