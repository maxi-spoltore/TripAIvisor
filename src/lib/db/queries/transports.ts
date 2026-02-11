import { createAdminClient } from '@/lib/supabase/admin';
import type { Transport, TransportRole, TransportType } from '@/types/database';

const NOT_FOUND_ERROR_CODE = 'PGRST116';

type TransportUpsertInput = {
  destination_id?: number | null;
  trip_id?: number | null;
  transport_role: TransportRole;
  transport_type?: TransportType;
  leave_accommodation_time?: string | null;
  terminal?: string | null;
  company?: string | null;
  booking_number?: string | null;
  booking_code?: string | null;
  departure_time?: string | null;
};

type TransportContext = {
  destinationId: number | null;
  tripId: number | null;
  role: TransportRole;
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

function resolveTransportContext(input: TransportUpsertInput): TransportContext {
  const hasDestinationId = isValidId(input.destination_id);
  const hasTripId = isValidId(input.trip_id);

  if (hasDestinationId === hasTripId) {
    throw new Error('Transport must include exactly one parent: destination_id or trip_id.');
  }

  if (hasDestinationId) {
    if (input.transport_role !== 'destination') {
      throw new Error('Destination transports must use the destination role.');
    }

    return {
      destinationId: input.destination_id as number,
      tripId: null,
      role: 'destination'
    };
  }

  if (input.transport_role === 'destination') {
    throw new Error('Destination role requires destination_id.');
  }

  return {
    destinationId: null,
    tripId: input.trip_id as number,
    role: input.transport_role
  };
}

function buildTransportUpdates(input: TransportUpsertInput): Partial<Transport> {
  const updates: Partial<Transport> = {};

  if (input.transport_type !== undefined) {
    updates.transport_type = input.transport_type;
  }

  const leaveAccommodationTime = normalizeOptionalTime(input.leave_accommodation_time);
  if (leaveAccommodationTime !== undefined) {
    updates.leave_accommodation_time = leaveAccommodationTime;
  }

  const terminal = normalizeOptionalText(input.terminal);
  if (terminal !== undefined) {
    updates.terminal = terminal;
  }

  const company = normalizeOptionalText(input.company);
  if (company !== undefined) {
    updates.company = company;
  }

  const bookingNumber = normalizeOptionalText(input.booking_number);
  if (bookingNumber !== undefined) {
    updates.booking_number = bookingNumber;
  }

  const bookingCode = normalizeOptionalText(input.booking_code);
  if (bookingCode !== undefined) {
    updates.booking_code = bookingCode;
  }

  const departureTime = normalizeOptionalTime(input.departure_time);
  if (departureTime !== undefined) {
    updates.departure_time = departureTime;
  }

  return updates;
}

async function getExistingTransport(
  context: TransportContext,
  supabase: ReturnType<typeof createAdminClient>
): Promise<Transport | null> {
  const query = supabase.from('transports').select('*');

  const response = context.destinationId
    ? await query.eq('destination_id', context.destinationId).eq('transport_role', 'destination').single()
    : await query.eq('trip_id', context.tripId).eq('transport_role', context.role).single();

  if (response.error) {
    if (isNotFoundError(response.error)) {
      return null;
    }

    throw response.error;
  }

  return response.data as Transport;
}

export async function getTransportByDestination(destinationId: number): Promise<Transport | null> {
  if (!isValidId(destinationId)) {
    throw new Error('destinationId must be a positive number.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('transports')
    .select('*')
    .eq('destination_id', destinationId)
    .eq('transport_role', 'destination')
    .single();

  if (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }

  return data as Transport;
}

export async function getTripTransports(
  tripId: number
): Promise<{ departure: Transport | null; return: Transport | null }> {
  if (!isValidId(tripId)) {
    throw new Error('tripId must be a positive number.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('transports')
    .select('*')
    .eq('trip_id', tripId)
    .in('transport_role', ['departure', 'return']);

  if (error) {
    throw error;
  }

  const transports = (data ?? []) as Transport[];

  return {
    departure: transports.find((transport) => transport.transport_role === 'departure') ?? null,
    return: transports.find((transport) => transport.transport_role === 'return') ?? null
  };
}

export async function upsertTransport(input: TransportUpsertInput): Promise<Transport> {
  const context = resolveTransportContext(input);
  const updates = buildTransportUpdates(input);
  const supabase = createAdminClient();
  const existingTransport = await getExistingTransport(context, supabase);

  if (existingTransport) {
    if (Object.keys(updates).length === 0) {
      return existingTransport;
    }

    const { data, error } = await supabase
      .from('transports')
      .update(updates)
      .eq('transport_id', existingTransport.transport_id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data as Transport;
  }

  const insertPayload: Record<string, unknown> = {
    destination_id: context.destinationId,
    trip_id: context.tripId,
    transport_role: context.role,
    ...updates
  };

  if (!('transport_type' in insertPayload)) {
    insertPayload.transport_type = 'plane';
  }

  const { data, error } = await supabase
    .from('transports')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Transport;
}
