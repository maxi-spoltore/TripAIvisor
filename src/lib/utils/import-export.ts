import type { Transport, TransportType, TripWithRelations } from '@/types/database';

export interface ExportedTransport {
  type?: TransportType;
  leaveAccommodationTime?: string | null;
  terminal?: string | null;
  company?: string | null;
  bookingNumber?: string | null;
  bookingCode?: string | null;
  departureTime?: string | null;
}

export interface ExportedAccommodation {
  checkIn?: string | null;
  checkOut?: string | null;
  name?: string | null;
  bookingLink?: string | null;
  bookingCode?: string | null;
  address?: string | null;
}

export interface ExportedDeparture {
  type: 'departure';
  city: string;
  date: string | null;
  transport: ExportedTransport;
}

export interface ExportedReturn {
  type: 'return';
  city: string;
  transport: ExportedTransport;
}

export interface ExportedDestination {
  id: string;
  city: string;
  duration: number;
  transport: ExportedTransport;
  accommodation: ExportedAccommodation;
  notes: string;
  budget: number | null;
}

export interface ExportedTrip {
  title: string;
  startDate: string | null;
  departure: ExportedDeparture | null;
  destinations: ExportedDestination[];
  return: ExportedReturn | null;
}

function toExportedTransport(transport: Transport): ExportedTransport {
  return {
    type: transport.transport_type,
    leaveAccommodationTime: transport.leave_accommodation_time,
    terminal: transport.terminal,
    company: transport.company,
    bookingNumber: transport.booking_number,
    bookingCode: transport.booking_code,
    departureTime: transport.departure_time
  };
}

export function exportTrip(trip: TripWithRelations): ExportedTrip {
  return {
    title: trip.title,
    startDate: trip.start_date,
    departure: trip.departure_transport
      ? {
          type: 'departure',
          city: trip.departure_city,
          date: trip.start_date,
          transport: toExportedTransport(trip.departure_transport)
        }
      : null,
    destinations: trip.destinations.map((destination) => ({
      id: String(destination.destination_id),
      city: destination.city,
      duration: destination.duration,
      transport: destination.transport ? toExportedTransport(destination.transport) : {},
      accommodation: destination.accommodation
        ? {
            checkIn: destination.accommodation.check_in,
            checkOut: destination.accommodation.check_out,
            name: destination.accommodation.name,
            bookingLink: destination.accommodation.booking_link,
            bookingCode: destination.accommodation.booking_code,
            address: destination.accommodation.address
          }
        : {},
      notes: destination.notes ?? '',
      budget: destination.budget
    })),
    return: trip.return_transport
      ? {
          type: 'return',
          city: trip.return_city ?? trip.departure_city,
          transport: toExportedTransport(trip.return_transport)
        }
      : null
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isTransportType(value: unknown): value is TransportType {
  return value === 'plane' || value === 'train' || value === 'bus';
}

function isExportedTransport(value: unknown): value is ExportedTransport {
  if (!isObject(value)) {
    return false;
  }

  if (value.type !== undefined && !isTransportType(value.type)) {
    return false;
  }

  const optionalFields: Array<keyof Omit<ExportedTransport, 'type'>> = [
    'leaveAccommodationTime',
    'terminal',
    'company',
    'bookingNumber',
    'bookingCode',
    'departureTime'
  ];

  return optionalFields.every((field) => value[field] === undefined || isStringOrNull(value[field]));
}

function isExportedAccommodation(value: unknown): value is ExportedAccommodation {
  if (!isObject(value)) {
    return false;
  }

  const optionalFields: Array<keyof ExportedAccommodation> = [
    'checkIn',
    'checkOut',
    'name',
    'bookingLink',
    'bookingCode',
    'address'
  ];

  return optionalFields.every((field) => value[field] === undefined || isStringOrNull(value[field]));
}

function isExportedDestination(value: unknown): value is ExportedDestination {
  if (!isObject(value)) {
    return false;
  }

  if (typeof value.id !== 'string' && typeof value.id !== 'number') {
    return false;
  }

  if (typeof value.city !== 'string' || value.city.trim().length === 0) {
    return false;
  }

  if (typeof value.duration !== 'number' || !Number.isFinite(value.duration)) {
    return false;
  }

  if (value.notes !== undefined && typeof value.notes !== 'string') {
    return false;
  }

  if (value.budget !== undefined && value.budget !== null && typeof value.budget !== 'number') {
    return false;
  }

  const transport = value.transport ?? {};
  const accommodation = value.accommodation ?? {};

  return isExportedTransport(transport) && isExportedAccommodation(accommodation);
}

function isExportedDeparture(value: unknown): boolean {
  if (value === null) {
    return true;
  }

  if (!isObject(value)) {
    return false;
  }

  return (
    value.type === 'departure' &&
    typeof value.city === 'string' &&
    isStringOrNull(value.date ?? null) &&
    isExportedTransport(value.transport ?? {})
  );
}

function isExportedReturn(value: unknown): boolean {
  if (value === null) {
    return true;
  }

  if (!isObject(value)) {
    return false;
  }

  return value.type === 'return' && typeof value.city === 'string' && isExportedTransport(value.transport ?? {});
}

export function validateImportData(data: unknown): data is ExportedTrip {
  if (!isObject(data)) {
    return false;
  }

  if (typeof data.title !== 'string') {
    return false;
  }

  if (data.startDate !== undefined && !isStringOrNull(data.startDate)) {
    return false;
  }

  if (!Array.isArray(data.destinations) || !data.destinations.every(isExportedDestination)) {
    return false;
  }

  return isExportedDeparture(data.departure ?? null) && isExportedReturn(data.return ?? null);
}
