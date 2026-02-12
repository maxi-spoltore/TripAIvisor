'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { upsertAccommodation } from '@/lib/db/queries/accommodations';
import { createDestination, updateDestination } from '@/lib/db/queries/destinations';
import { upsertTransport } from '@/lib/db/queries/transports';
import { createTrip, deleteTrip, updateTrip } from '@/lib/db/queries/trips';
import {
  type ExportedAccommodation,
  type ExportedDestination,
  type ExportedTransport,
  validateImportData
} from '@/lib/utils/import-export';
import type { TransportType } from '@/types/database';

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
  };
};

const DEFAULT_DEPARTURE_CITY = 'Buenos Aires';
const MAX_IMPORTED_DESTINATIONS = 200;

function parseUserId(session: SessionUser | null): number | null {
  const rawUserId = session?.user?.id ?? session?.user?.user_id;
  const userId = Number(rawUserId);

  return Number.isFinite(userId) ? userId : null;
}

async function requireUserId(locale: string): Promise<number> {
  const session = (await auth.api.getSession({
    headers: new Headers(headers())
  })) as SessionUser | null;

  const userId = parseUserId(session);

  if (!userId) {
    redirect(`/${locale}/login`);
  }

  return userId;
}

function parseTripId(value: FormDataEntryValue | null): number | null {
  const tripId = Number(value);
  return Number.isFinite(tripId) ? tripId : null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeDuration(value: number): number {
  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : 1;
}

function normalizeBudget(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function normalizeTransportType(value: TransportType | undefined): TransportType {
  if (value === 'bus' || value === 'train' || value === 'plane') {
    return value;
  }

  return 'plane';
}

function hasImportTransportValues(transport: ExportedTransport): boolean {
  return (
    transport.type !== undefined ||
    transport.leaveAccommodationTime !== undefined ||
    transport.terminal !== undefined ||
    transport.company !== undefined ||
    transport.bookingNumber !== undefined ||
    transport.bookingCode !== undefined ||
    transport.departureTime !== undefined
  );
}

function hasImportAccommodationValues(accommodation: ExportedAccommodation): boolean {
  return (
    accommodation.checkIn !== undefined ||
    accommodation.checkOut !== undefined ||
    accommodation.name !== undefined ||
    accommodation.bookingLink !== undefined ||
    accommodation.bookingCode !== undefined ||
    accommodation.address !== undefined
  );
}

function normalizeDestinationCity(destination: ExportedDestination): string {
  const normalizedCity = destination.city.trim();
  return normalizedCity || 'Unnamed destination';
}

export async function createTripForLocaleAction(locale: string, formData: FormData): Promise<number> {
  const userId = await requireUserId(locale);
  const titleValue = formData.get('title');
  const title = typeof titleValue === 'string' ? titleValue : '';

  const trip = await createTrip(userId, title);

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/trips`);
  return trip.trip_id;
}

export async function createTripAndRedirectAction(locale: string, formData: FormData): Promise<void> {
  const tripId = await createTripForLocaleAction(locale, formData);
  redirect(`/${locale}/trips/${tripId}`);
}

export async function deleteTripForLocaleAction(locale: string, formData: FormData): Promise<void> {
  await requireUserId(locale);

  const tripId = parseTripId(formData.get('tripId'));
  if (!tripId) {
    return;
  }

  await deleteTrip(tripId);

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/trips`);
}

export async function updateTripTitleAction(input: { locale: string; tripId: number; title: string }): Promise<void> {
  const { locale, tripId, title } = input;

  await requireUserId(locale);

  if (!Number.isFinite(tripId)) {
    return;
  }

  await updateTrip(tripId, {
    title: title.trim() || 'Mi Viaje'
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/trips`);
  revalidatePath(`/${locale}/trips/${tripId}`);
}

export async function importTripFromDataAction(input: {
  locale: string;
  data: unknown;
}): Promise<number> {
  const { locale, data } = input;
  const userId = await requireUserId(locale);

  if (!validateImportData(data)) {
    throw new Error('Invalid import format.');
  }

  if (data.destinations.length > MAX_IMPORTED_DESTINATIONS) {
    throw new Error('The import file has too many destinations.');
  }

  const title = data.title.trim() || 'Mi Viaje';
  const trip = await createTrip(userId, title);

  const normalizedDepartureCity = normalizeOptionalText(data.departure?.city) ?? DEFAULT_DEPARTURE_CITY;
  const normalizedReturnCity = normalizeOptionalText(data.return?.city);
  const normalizedStartDate =
    normalizeOptionalText(data.startDate) ?? normalizeOptionalText(data.departure?.date) ?? null;

  await updateTrip(trip.trip_id, {
    start_date: normalizedStartDate,
    departure_city: normalizedDepartureCity,
    return_city: normalizedReturnCity
  });

  const departureTransport = data.departure?.transport ?? {};
  if (hasImportTransportValues(departureTransport)) {
    await upsertTransport({
      trip_id: trip.trip_id,
      transport_role: 'departure',
      transport_type: normalizeTransportType(departureTransport.type),
      leave_accommodation_time: normalizeOptionalText(departureTransport.leaveAccommodationTime),
      terminal: normalizeOptionalText(departureTransport.terminal),
      company: normalizeOptionalText(departureTransport.company),
      booking_number: normalizeOptionalText(departureTransport.bookingNumber),
      booking_code: normalizeOptionalText(departureTransport.bookingCode),
      departure_time: normalizeOptionalText(departureTransport.departureTime)
    });
  }

  const returnTransport = data.return?.transport ?? {};
  if (hasImportTransportValues(returnTransport)) {
    await upsertTransport({
      trip_id: trip.trip_id,
      transport_role: 'return',
      transport_type: normalizeTransportType(returnTransport.type),
      leave_accommodation_time: normalizeOptionalText(returnTransport.leaveAccommodationTime),
      terminal: normalizeOptionalText(returnTransport.terminal),
      company: normalizeOptionalText(returnTransport.company),
      booking_number: normalizeOptionalText(returnTransport.bookingNumber),
      booking_code: normalizeOptionalText(returnTransport.bookingCode),
      departure_time: normalizeOptionalText(returnTransport.departureTime)
    });
  }

  for (const [position, destination] of data.destinations.entries()) {
    const createdDestination = await createDestination(
      trip.trip_id,
      normalizeDestinationCity(destination),
      normalizeDuration(destination.duration),
      position
    );

    const normalizedNotes = normalizeOptionalText(destination.notes);
    const normalizedBudget = normalizeBudget(destination.budget);
    if (normalizedNotes !== null || normalizedBudget !== null) {
      await updateDestination(
        createdDestination.destination_id,
        {
          notes: normalizedNotes,
          budget: normalizedBudget
        },
        trip.trip_id
      );
    }

    const destinationTransport = destination.transport ?? {};
    if (hasImportTransportValues(destinationTransport)) {
      await upsertTransport({
        destination_id: createdDestination.destination_id,
        transport_role: 'destination',
        transport_type: normalizeTransportType(destinationTransport.type),
        leave_accommodation_time: normalizeOptionalText(destinationTransport.leaveAccommodationTime),
        terminal: normalizeOptionalText(destinationTransport.terminal),
        company: normalizeOptionalText(destinationTransport.company),
        booking_number: normalizeOptionalText(destinationTransport.bookingNumber),
        booking_code: normalizeOptionalText(destinationTransport.bookingCode),
        departure_time: normalizeOptionalText(destinationTransport.departureTime)
      });
    }

    const destinationAccommodation = destination.accommodation ?? {};
    if (hasImportAccommodationValues(destinationAccommodation)) {
      await upsertAccommodation({
        destination_id: createdDestination.destination_id,
        check_in: normalizeOptionalText(destinationAccommodation.checkIn),
        check_out: normalizeOptionalText(destinationAccommodation.checkOut),
        name: normalizeOptionalText(destinationAccommodation.name),
        booking_link: normalizeOptionalText(destinationAccommodation.bookingLink),
        booking_code: normalizeOptionalText(destinationAccommodation.bookingCode),
        address: normalizeOptionalText(destinationAccommodation.address)
      });
    }
  }

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/trips`);
  revalidatePath(`/${locale}/trips/${trip.trip_id}`);

  return trip.trip_id;
}
