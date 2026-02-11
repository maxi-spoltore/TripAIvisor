import { createAdminClient } from '@/lib/supabase/admin';
import type { Destination } from '@/types/database';

type DestinationUpdates = Partial<Pick<Destination, 'city' | 'duration' | 'position' | 'notes' | 'budget'>>;

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
  return normalized > 0 ? normalized : 1;
}

function normalizeCity(city: string): string {
  const normalized = city.trim();
  if (!normalized) {
    throw new Error('Destination city is required.');
  }

  return normalized;
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
  position?: number
): Promise<Destination> {
  const supabase = createAdminClient();
  const resolvedPosition =
    typeof position === 'number' && Number.isFinite(position)
      ? Math.max(0, Math.trunc(position))
      : await getNextDestinationPosition(tripId);

  const { data, error } = await supabase
    .from('destinations')
    .insert({
      trip_id: tripId,
      city: normalizeCity(city),
      duration: normalizeDuration(duration),
      position: resolvedPosition
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
    normalizedUpdates.duration = normalizeDuration(updates.duration);
  }
  if (typeof updates.position === 'number') {
    normalizedUpdates.position = Math.max(0, Math.trunc(updates.position));
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
