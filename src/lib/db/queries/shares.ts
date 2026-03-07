import { nanoid } from 'nanoid';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  Accommodation,
  Activity,
  Destination,
  DestinationWithRelations,
  TransportLeg,
  TransportWithLegs,
  Transport,
  Trip,
  TripWithRelations
} from '@/types/database';

const NOT_FOUND_ERROR_CODE = 'PGRST116';
const UNIQUE_VIOLATION_CODE = '23505';
const SHARE_TOKEN_LENGTH = 12;
const MAX_TOKEN_ATTEMPTS = 3;

function isNotFoundError(error: { code?: string } | null): boolean {
  return Boolean(error && error.code === NOT_FOUND_ERROR_CODE);
}

function isUniqueViolationError(error: { code?: string } | null): boolean {
  return Boolean(error && error.code === UNIQUE_VIOLATION_CODE);
}

function normalizeShareLocale(locale: string | undefined): 'es' | 'en' {
  return locale === 'en' ? 'en' : 'es';
}

function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;

  if (!appUrl) {
    throw new Error('Missing NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL.');
  }

  return appUrl.replace(/\/$/, '');
}

async function getTripWithRelationsByIdUsingAdmin(tripId: number): Promise<TripWithRelations | null> {
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

  let activities: Activity[] = [];
  if (destinationIds.length > 0) {
    const { data: activityRows, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .in('destination_id', destinationIds)
      .order('day_number', { ascending: true })
      .order('position', { ascending: true });

    if (activityError) {
      throw activityError;
    }

    activities = (activityRows ?? []) as Activity[];
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
  const departureTransport = tripTransports.find((transport) => transport.transport_role === 'departure') ?? null;
  const returnTransport = tripTransports.find((transport) => transport.transport_role === 'return') ?? null;

  const transportIds = [departureTransport?.transport_id, returnTransport?.transport_id].filter(
    (id): id is number => id !== undefined && id !== null
  );

  const legsByTransportId = new Map<number, TransportLeg[]>();
  if (transportIds.length > 0) {
    const { data: legsRows, error: legsError } = await supabase
      .from('transport_legs')
      .select('*')
      .in('transport_id', transportIds)
      .order('position', { ascending: true });

    if (legsError) {
      throw legsError;
    }

    for (const leg of (legsRows ?? []) as TransportLeg[]) {
      const existingLegs = legsByTransportId.get(leg.transport_id) ?? [];
      existingLegs.push(leg);
      legsByTransportId.set(leg.transport_id, existingLegs);
    }
  }

  const transportsByDestinationId = new Map<number, Transport>();
  for (const transport of destinationTransports) {
    if (transport.destination_id !== null) {
      transportsByDestinationId.set(transport.destination_id, transport);
    }
  }

  const accommodationsByDestinationId = new Map<number, Accommodation>();
  for (const accommodation of accommodations) {
    accommodationsByDestinationId.set(accommodation.destination_id, accommodation);
  }

  const activitiesByDestinationId = new Map<number, Activity[]>();
  for (const activity of activities) {
    const existingActivities = activitiesByDestinationId.get(activity.destination_id) ?? [];
    existingActivities.push(activity);
    activitiesByDestinationId.set(activity.destination_id, existingActivities);
  }

  const destinationsWithRelations: DestinationWithRelations[] = destinations.map((destination) => ({
    ...destination,
    transport: transportsByDestinationId.get(destination.destination_id) ?? null,
    accommodation: accommodationsByDestinationId.get(destination.destination_id) ?? null,
    activities: activitiesByDestinationId.get(destination.destination_id) ?? []
  }));

  return {
    ...trip,
    destinations: destinationsWithRelations,
    departure_transport: departureTransport
      ? ({ ...departureTransport, legs: legsByTransportId.get(departureTransport.transport_id) ?? [] } as TransportWithLegs)
      : null,
    return_transport: returnTransport
      ? ({ ...returnTransport, legs: legsByTransportId.get(returnTransport.transport_id) ?? [] } as TransportWithLegs)
      : null
  };
}

export async function createShareLink(
  tripId: number,
  locale: string = 'es'
): Promise<{ shareUrl: string; shareToken: string }> {
  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw new Error('tripId must be a positive number.');
  }

  const supabase = createAdminClient();
  const safeLocale = normalizeShareLocale(locale);

  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt += 1) {
    const shareToken = nanoid(SHARE_TOKEN_LENGTH);

    const { error } = await supabase.from('trip_shares').insert({
      trip_id: tripId,
      share_token: shareToken
    });

    if (!error) {
      return {
        shareUrl: `${getAppUrl()}/${safeLocale}/share/${shareToken}`,
        shareToken
      };
    }

    if (!isUniqueViolationError(error)) {
      throw error;
    }
  }

  throw new Error('Could not generate a unique share token.');
}

export async function getSharedTrip(shareToken: string): Promise<TripWithRelations | null> {
  const normalizedToken = shareToken.trim();
  if (!normalizedToken) {
    return null;
  }

  const supabase = createAdminClient();

  const { data: shareRow, error: shareError } = await supabase
    .from('trip_shares')
    .select('trip_id, is_active, expires_at')
    .eq('share_token', normalizedToken)
    .single();

  if (shareError) {
    if (isNotFoundError(shareError)) {
      return null;
    }

    throw shareError;
  }

  if (!shareRow.is_active) {
    return null;
  }

  if (shareRow.expires_at && new Date(shareRow.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return getTripWithRelationsByIdUsingAdmin(shareRow.trip_id);
}

export async function deactivateShareLink(shareId: number): Promise<void> {
  if (!Number.isFinite(shareId) || shareId <= 0) {
    throw new Error('shareId must be a positive number.');
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('trip_shares')
    .update({ is_active: false })
    .eq('share_id', shareId);

  if (error) {
    throw error;
  }
}
