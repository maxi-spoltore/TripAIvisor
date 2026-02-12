import { createAdminClient } from '@/lib/supabase/admin';
import type {
  Accommodation,
  Destination,
  DestinationWithRelations,
  Transport,
  Trip,
  TripWithRelations
} from '@/types/database';

const NOT_FOUND_ERROR_CODE = 'PGRST116';

function isNotFoundError(error: { code?: string } | null): boolean {
  return Boolean(error && error.code === NOT_FOUND_ERROR_CODE);
}

export async function getUserTrips(userId: number): Promise<Trip[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Trip[];
}

type TripDestinationStats = {
  destinationCount: number;
  totalDays: number;
};

export async function getTripDestinationStats(tripIds: number[]): Promise<Record<number, TripDestinationStats>> {
  const stats: Record<number, TripDestinationStats> = {};

  if (tripIds.length === 0) {
    return stats;
  }

  for (const tripId of tripIds) {
    stats[tripId] = { destinationCount: 0, totalDays: 0 };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('destinations')
    .select('trip_id, duration')
    .in('trip_id', tripIds);

  if (error) {
    throw error;
  }

  const destinations = (data ?? []) as Pick<Destination, 'trip_id' | 'duration'>[];

  for (const destination of destinations) {
    const tripStats = stats[destination.trip_id] ?? { destinationCount: 0, totalDays: 0 };
    tripStats.destinationCount += 1;
    tripStats.totalDays += destination.duration || 0;
    stats[destination.trip_id] = tripStats;
  }

  return stats;
}

export async function getTripById(tripId: number): Promise<TripWithRelations | null> {
  const supabase = createAdminClient();

  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('trip_id', tripId)
    .single();

  if (tripError) {
    if (isNotFoundError(tripError)) {
      return null;
    }

    throw tripError;
  }

  const trip = tripData as Trip;

  const { data: destinationRows, error: destinationError } = await supabase
    .from('destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('position', { ascending: true });

  if (destinationError) {
    throw destinationError;
  }

  const destinations = (destinationRows ?? []) as Destination[];
  const destinationIds = destinations.map((destination) => destination.destination_id);

  let destinationTransports: Transport[] = [];
  if (destinationIds.length > 0) {
    const { data: transportRows, error: transportError } = await supabase
      .from('transports')
      .select('*')
      .in('destination_id', destinationIds)
      .eq('transport_role', 'destination');

    if (transportError) {
      throw transportError;
    }

    destinationTransports = (transportRows ?? []) as Transport[];
  }

  let accommodations: Accommodation[] = [];
  if (destinationIds.length > 0) {
    const { data: accommodationRows, error: accommodationError } = await supabase
      .from('accommodations')
      .select('*')
      .in('destination_id', destinationIds);

    if (accommodationError) {
      throw accommodationError;
    }

    accommodations = (accommodationRows ?? []) as Accommodation[];
  }

  const { data: tripTransportRows, error: tripTransportError } = await supabase
    .from('transports')
    .select('*')
    .eq('trip_id', tripId)
    .in('transport_role', ['departure', 'return']);

  if (tripTransportError) {
    throw tripTransportError;
  }

  const tripTransports = (tripTransportRows ?? []) as Transport[];

  const transportsByDestinationId = new Map<number, Transport>();
  for (const transport of destinationTransports) {
    if (transport.destination_id) {
      transportsByDestinationId.set(transport.destination_id, transport);
    }
  }

  const accommodationsByDestinationId = new Map<number, Accommodation>();
  for (const accommodation of accommodations) {
    accommodationsByDestinationId.set(accommodation.destination_id, accommodation);
  }

  const destinationsWithRelations: DestinationWithRelations[] = destinations.map((destination) => ({
    ...destination,
    transport: transportsByDestinationId.get(destination.destination_id) ?? null,
    accommodation: accommodationsByDestinationId.get(destination.destination_id) ?? null
  }));

  return {
    ...trip,
    destinations: destinationsWithRelations,
    departure_transport: tripTransports.find((transport) => transport.transport_role === 'departure') ?? null,
    return_transport: tripTransports.find((transport) => transport.transport_role === 'return') ?? null
  };
}

export async function createTrip(userId: number, title: string): Promise<Trip> {
  const supabase = createAdminClient();
  const safeTitle = title.trim() || 'Mi Viaje';

  const { data, error } = await supabase
    .from('trips')
    .insert({ user_id: userId, title: safeTitle })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Trip;
}

export async function updateTrip(
  tripId: number,
  updates: Partial<Pick<Trip, 'title' | 'start_date' | 'departure_city' | 'return_city'>>
): Promise<Trip> {
  const supabase = createAdminClient();

  if (Object.keys(updates).length === 0) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    if (error) {
      throw error;
    }

    return data as Trip;
  }

  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('trip_id', tripId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Trip;
}

export async function deleteTrip(tripId: number): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('trips').delete().eq('trip_id', tripId);

  if (error) {
    throw error;
  }
}
