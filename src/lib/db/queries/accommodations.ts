import { createAdminClient } from '@/lib/supabase/admin';
import type { Accommodation } from '@/types/database';

const NOT_FOUND_ERROR_CODE = 'PGRST116';

type AccommodationUpsertInput = {
  destination_id: number;
  name?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  booking_link?: string | null;
  booking_code?: string | null;
  address?: string | null;
};

function isNotFoundError(error: { code?: string } | null): boolean {
  return Boolean(error && error.code === NOT_FOUND_ERROR_CODE);
}

function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalTime(value: string | null | undefined): string | null | undefined {
  return normalizeOptionalText(value);
}

function buildAccommodationUpdates(input: AccommodationUpsertInput): Partial<Accommodation> {
  const updates: Partial<Accommodation> = {};

  const name = normalizeOptionalText(input.name);
  if (name !== undefined) {
    updates.name = name;
  }

  const checkIn = normalizeOptionalTime(input.check_in);
  if (checkIn !== undefined) {
    updates.check_in = checkIn;
  }

  const checkOut = normalizeOptionalTime(input.check_out);
  if (checkOut !== undefined) {
    updates.check_out = checkOut;
  }

  const bookingLink = normalizeOptionalText(input.booking_link);
  if (bookingLink !== undefined) {
    updates.booking_link = bookingLink;
  }

  const bookingCode = normalizeOptionalText(input.booking_code);
  if (bookingCode !== undefined) {
    updates.booking_code = bookingCode;
  }

  const address = normalizeOptionalText(input.address);
  if (address !== undefined) {
    updates.address = address;
  }

  return updates;
}

async function getExistingAccommodationByDestination(
  destinationId: number,
  supabase: ReturnType<typeof createAdminClient>
): Promise<Accommodation | null> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('*')
    .eq('destination_id', destinationId)
    .single();

  if (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }

  return data as Accommodation;
}

export async function getAccommodationByDestination(destinationId: number): Promise<Accommodation | null> {
  if (!isValidId(destinationId)) {
    throw new Error('destinationId must be a positive number.');
  }

  const supabase = createAdminClient();
  return getExistingAccommodationByDestination(destinationId, supabase);
}

export async function upsertAccommodation(input: AccommodationUpsertInput): Promise<Accommodation> {
  if (!isValidId(input.destination_id)) {
    throw new Error('destination_id must be a positive number.');
  }

  const updates = buildAccommodationUpdates(input);
  const supabase = createAdminClient();
  const existingAccommodation = await getExistingAccommodationByDestination(input.destination_id, supabase);

  if (existingAccommodation) {
    if (Object.keys(updates).length === 0) {
      return existingAccommodation;
    }

    const { data, error } = await supabase
      .from('accommodations')
      .update(updates)
      .eq('accommodation_id', existingAccommodation.accommodation_id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data as Accommodation;
  }

  const { data, error } = await supabase
    .from('accommodations')
    .insert({
      destination_id: input.destination_id,
      ...updates
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Accommodation;
}
