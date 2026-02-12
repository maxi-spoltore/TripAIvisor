'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  createDestination,
  deleteDestination,
  reorderDestinations,
  updateDestination
} from '@/lib/db/queries/destinations';
import {
  getTransportByDestination,
  upsertTransport
} from '@/lib/db/queries/transports';
import {
  getAccommodationByDestination,
  upsertAccommodation
} from '@/lib/db/queries/accommodations';
import type { Destination, DestinationWithRelations, TransportType } from '@/types/database';

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
  };
};

type DestinationUpdateInput = {
  locale: string;
  tripId: number;
  destinationId: number;
  city?: string;
  duration?: number;
  position?: number;
  notes?: string | null;
  budget?: number | null;
};

type DestinationDetailsTransportInput = {
  transport_type: TransportType;
  leave_accommodation_time: string | null;
  terminal: string | null;
  company: string | null;
  booking_number: string | null;
  booking_code: string | null;
  departure_time: string | null;
};

type DestinationDetailsAccommodationInput = {
  check_in: string | null;
  check_out: string | null;
  name: string | null;
  booking_link: string | null;
  booking_code: string | null;
  address: string | null;
};

type DestinationDetailsInput = {
  locale: string;
  tripId: number;
  destinationId: number;
  city: string;
  duration: number;
  notes: string | null;
  budget: number | null;
  transport: DestinationDetailsTransportInput;
  accommodation: DestinationDetailsAccommodationInput;
};

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

function revalidateTripPaths(locale: string, tripId: number): void {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/trips`);
  revalidatePath(`/${locale}/trips/${tripId}`);
}

function hasTransportValues(transport: DestinationDetailsTransportInput): boolean {
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

function hasAccommodationValues(accommodation: DestinationDetailsAccommodationInput): boolean {
  return Boolean(
    accommodation.check_in ||
      accommodation.check_out ||
      accommodation.name ||
      accommodation.booking_link ||
      accommodation.booking_code ||
      accommodation.address
  );
}

export async function createDestinationAction(input: {
  locale: string;
  tripId: number;
  city: string;
  duration: number;
}): Promise<Destination> {
  const { locale, tripId, city, duration } = input;

  await requireUserId(locale);

  if (!Number.isFinite(tripId)) {
    throw new Error('Invalid trip id.');
  }

  const destination = await createDestination(tripId, city, duration);
  revalidateTripPaths(locale, tripId);

  return destination;
}

export async function updateDestinationAction(input: DestinationUpdateInput): Promise<Destination> {
  const { locale, tripId, destinationId, ...updates } = input;

  await requireUserId(locale);

  if (!Number.isFinite(tripId) || !Number.isFinite(destinationId)) {
    throw new Error('Invalid destination update payload.');
  }

  const destination = await updateDestination(destinationId, updates, tripId);
  revalidateTripPaths(locale, tripId);

  return destination;
}

export async function deleteDestinationAction(input: {
  locale: string;
  tripId: number;
  destinationId: number;
}): Promise<void> {
  const { locale, tripId, destinationId } = input;

  await requireUserId(locale);

  if (!Number.isFinite(tripId) || !Number.isFinite(destinationId)) {
    throw new Error('Invalid destination delete payload.');
  }

  await deleteDestination(destinationId, tripId);
  revalidateTripPaths(locale, tripId);
}

export async function reorderDestinationsAction(input: {
  locale: string;
  tripId: number;
  orderedIds: number[];
}): Promise<void> {
  const { locale, tripId, orderedIds } = input;

  await requireUserId(locale);

  if (!Number.isFinite(tripId)) {
    throw new Error('Invalid trip id for destination reorder.');
  }

  const filteredIds = orderedIds.filter((destinationId) => Number.isFinite(destinationId));
  if (filteredIds.length !== orderedIds.length) {
    throw new Error('Invalid destination ids for reorder.');
  }

  await reorderDestinations(tripId, filteredIds);
  revalidateTripPaths(locale, tripId);
}

export async function saveDestinationDetailsAction(
  input: DestinationDetailsInput
): Promise<DestinationWithRelations> {
  const { locale, tripId, destinationId, city, duration, notes, budget, transport, accommodation } = input;

  await requireUserId(locale);

  if (!Number.isFinite(tripId) || !Number.isFinite(destinationId)) {
    throw new Error('Invalid destination details payload.');
  }

  if (!Number.isFinite(duration) || duration < 1) {
    throw new Error('Duration must be at least 1.');
  }

  if (budget !== null && !Number.isFinite(budget)) {
    throw new Error('Budget must be a valid number or null.');
  }

  const updatedDestination = await updateDestination(
    destinationId,
    {
      city,
      duration,
      notes,
      budget
    },
    tripId
  );

  const existingTransport = await getTransportByDestination(destinationId);
  const transportShouldPersist = hasTransportValues(transport) || Boolean(existingTransport);
  const updatedTransport = transportShouldPersist
    ? await upsertTransport({
        destination_id: destinationId,
        transport_role: 'destination',
        transport_type: transport.transport_type,
        leave_accommodation_time: transport.leave_accommodation_time,
        terminal: transport.terminal,
        company: transport.company,
        booking_number: transport.booking_number,
        booking_code: transport.booking_code,
        departure_time: transport.departure_time
      })
    : null;

  const existingAccommodation = await getAccommodationByDestination(destinationId);
  const accommodationShouldPersist = hasAccommodationValues(accommodation) || Boolean(existingAccommodation);
  const updatedAccommodation = accommodationShouldPersist
    ? await upsertAccommodation({
        destination_id: destinationId,
        check_in: accommodation.check_in,
        check_out: accommodation.check_out,
        name: accommodation.name,
        booking_link: accommodation.booking_link,
        booking_code: accommodation.booking_code,
        address: accommodation.address
      })
    : null;

  revalidateTripPaths(locale, tripId);

  return {
    ...updatedDestination,
    transport: updatedTransport,
    accommodation: updatedAccommodation
  };
}
