import { createAdminClient } from '@/lib/supabase/admin';
import type { Destination } from '@/types/database';

type DestinationUpdates = Partial<
  Pick<Destination, 'city' | 'duration' | 'position' | 'is_stopover' | 'notes' | 'budget'>
>;

async function getNextDestinationPosition(tripId: number): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('destinations')
    .select('position')
    .eq('trip_id', tripId)
    .order('position', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const highestPosition = data?.[0]?.position;
  return typeof highestPosition === 'number' ? highestPosition + 1 : 0;
}

function normalizeDuration(duration: number): number {
  const normalized = Math.trunc(duration);
  return normalized >= 0 ? normalized : 0;
}

function normalizeCity(city: string): string {
  const normalized = city.trim();
  if (!normalized) {
    throw new Error('Destination city is required.');
  }

  return normalized;
}

async function shiftDestinationsDown(tripId: number, fromPosition: number): Promise<void> {
  const supabase = createAdminClient();
  const { data, error: fetchError } = await supabase
    .from('destinations')
    .select('destination_id, position')
    .eq('trip_id', tripId)
    .gte('position', fromPosition)
    .order('position', { ascending: false });

  if (fetchError) {
    throw fetchError;
  }

  for (const destination of (data ?? []) as Pick<Destination, 'destination_id' | 'position'>[]) {
    const { error } = await supabase
      .from('destinations')
      .update({ position: destination.position + 1 })
      .eq('destination_id', destination.destination_id);

    if (error) {
      throw error;
    }
  }
}

export async function getDestinationsByTrip(tripId: number): Promise<Destination[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Destination[];
}

export async function createDestination(
  tripId: number,
  city: string,
  duration: number,
  position?: number,
  isStopover?: boolean
): Promise<Destination> {
  const supabase = createAdminClient();
  const normalizedStopover = Boolean(isStopover);
  const nextPosition = await getNextDestinationPosition(tripId);
  const hasExplicitPosition = typeof position === 'number' && Number.isFinite(position);
  const resolvedPosition = hasExplicitPosition
    ? Math.max(0, Math.min(Math.trunc(position), nextPosition))
    : nextPosition;

  if (hasExplicitPosition && resolvedPosition < nextPosition) {
    await shiftDestinationsDown(tripId, resolvedPosition);
  }

  const { data, error } = await supabase
    .from('destinations')
    .insert({
      trip_id: tripId,
      city: normalizeCity(city),
      duration: normalizedStopover ? normalizeDuration(duration) : Math.max(1, normalizeDuration(duration)),
      position: resolvedPosition,
      is_stopover: normalizedStopover
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Destination;
}

export async function updateDestination(
  destinationId: number,
  updates: DestinationUpdates,
  tripId?: number
): Promise<Destination> {
  const supabase = createAdminClient();

  const normalizedUpdates: DestinationUpdates = {};
  if (typeof updates.city === 'string') {
    normalizedUpdates.city = normalizeCity(updates.city);
  }
  if (typeof updates.duration === 'number') {
    const normalizedDuration = normalizeDuration(updates.duration);
    if (updates.is_stopover === true) {
      normalizedUpdates.duration = normalizedDuration;
    } else {
      normalizedUpdates.duration = Math.max(1, normalizedDuration);
    }
  }
  if (typeof updates.position === 'number') {
    normalizedUpdates.position = Math.max(0, Math.trunc(updates.position));
  }
  if (typeof updates.is_stopover === 'boolean') {
    normalizedUpdates.is_stopover = updates.is_stopover;
    if (updates.is_stopover === false && normalizedUpdates.duration !== undefined) {
      normalizedUpdates.duration = Math.max(1, normalizedUpdates.duration);
    }
  }
  if (updates.notes !== undefined) {
    normalizedUpdates.notes = updates.notes;
  }
  if (updates.budget !== undefined) {
    if (updates.budget === null) {
      normalizedUpdates.budget = null;
    } else if (typeof updates.budget === 'number' && Number.isFinite(updates.budget)) {
      normalizedUpdates.budget = updates.budget;
    } else {
      throw new Error('Destination budget must be a valid number or null.');
    }
  }

  if (Object.keys(normalizedUpdates).length === 0) {
    let query = supabase.from('destinations').select('*').eq('destination_id', destinationId);

    if (typeof tripId === 'number' && Number.isFinite(tripId)) {
      query = query.eq('trip_id', tripId);
    }

    const { data, error } = await query.single();
    if (error) {
      throw error;
    }

    return data as Destination;
  }

  let query = supabase.from('destinations').update(normalizedUpdates).eq('destination_id', destinationId);

  if (typeof tripId === 'number' && Number.isFinite(tripId)) {
    query = query.eq('trip_id', tripId);
  }

  const { data, error } = await query.select('*').single();

  if (error) {
    throw error;
  }

  return data as Destination;
}

export async function deleteDestination(destinationId: number, tripId?: number): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase.from('destinations').delete().eq('destination_id', destinationId);

  if (typeof tripId === 'number' && Number.isFinite(tripId)) {
    query = query.eq('trip_id', tripId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}

export async function reorderDestinations(tripId: number, orderedIds: number[]): Promise<void> {
  if (orderedIds.length === 0) {
    return;
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    throw new Error('orderedIds must contain unique destination ids.');
  }

  const supabase = createAdminClient();

  for (const [position, destinationId] of orderedIds.entries()) {
    const { error } = await supabase
      .from('destinations')
      .update({ position })
      .eq('trip_id', tripId)
      .eq('destination_id', destinationId);

    if (error) {
      throw error;
    }
  }
}
