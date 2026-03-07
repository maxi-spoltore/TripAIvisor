import { createAdminClient } from '@/lib/supabase/admin';
import type { Activity, ActivityCategory } from '@/types/database';

export type ActivityCreateInput = {
  destination_id: number;
  category: ActivityCategory;
  name: string;
  day_number: number;
  start_time?: string | null;
  end_time?: string | null;
  position?: number;
  notes?: string | null;
  details?: Record<string, unknown>;
};

export type ActivityUpdateInput = {
  category?: ActivityCategory;
  name?: string;
  day_number?: number;
  start_time?: string | null;
  end_time?: string | null;
  position?: number;
  notes?: string | null;
  details?: Record<string, unknown>;
};

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

function normalizeRequiredName(name: string): string {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error('name cannot be empty.');
  }

  return normalizedName;
}

function normalizeDayNumber(dayNumber: number): number {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    throw new Error('day_number must be an integer greater than or equal to 1.');
  }

  return dayNumber;
}

function normalizePosition(position: number): number {
  if (!Number.isInteger(position) || position < 0) {
    throw new Error('position must be an integer greater than or equal to 0.');
  }

  return position;
}

async function getNextActivityPosition(destinationId: number, dayNumber: number): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('activities')
    .select('activity_id', { count: 'exact', head: true })
    .eq('destination_id', destinationId)
    .eq('day_number', dayNumber);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function buildActivityUpdates(input: ActivityUpdateInput): Partial<Activity> {
  const updates: Partial<Activity> = {};

  if (input.category !== undefined) {
    updates.category = input.category;
  }

  if (input.name !== undefined) {
    updates.name = normalizeRequiredName(input.name);
  }

  if (input.day_number !== undefined) {
    updates.day_number = normalizeDayNumber(input.day_number);
  }

  const startTime = normalizeOptionalTime(input.start_time);
  if (startTime !== undefined) {
    updates.start_time = startTime;
  }

  const endTime = normalizeOptionalTime(input.end_time);
  if (endTime !== undefined) {
    updates.end_time = endTime;
  }

  if (input.position !== undefined) {
    updates.position = normalizePosition(input.position);
  }

  const notes = normalizeOptionalText(input.notes);
  if (notes !== undefined) {
    updates.notes = notes;
  }

  if (input.details !== undefined) {
    updates.details = input.details;
  }

  return updates;
}

async function getActivityById(activityId: number): Promise<Activity> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('activity_id', activityId)
    .single();

  if (error) {
    throw error;
  }

  return data as Activity;
}

export async function getActivitiesByDestination(destinationId: number): Promise<Activity[]> {
  if (!isValidId(destinationId)) {
    throw new Error('destinationId must be a positive number.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('destination_id', destinationId)
    .order('day_number', { ascending: true })
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Activity[];
}

export async function createActivity(input: ActivityCreateInput): Promise<Activity> {
  if (!isValidId(input.destination_id)) {
    throw new Error('destination_id must be a positive number.');
  }

  const dayNumber = normalizeDayNumber(input.day_number);
  const name = normalizeRequiredName(input.name);
  const position =
    input.position !== undefined
      ? normalizePosition(input.position)
      : await getNextActivityPosition(input.destination_id, dayNumber);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('activities')
    .insert({
      destination_id: input.destination_id,
      category: input.category,
      name,
      day_number: dayNumber,
      start_time: normalizeOptionalTime(input.start_time) ?? null,
      end_time: normalizeOptionalTime(input.end_time) ?? null,
      position,
      notes: normalizeOptionalText(input.notes) ?? null,
      details: input.details ?? {}
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Activity;
}

export async function updateActivity(activityId: number, updates: ActivityUpdateInput): Promise<Activity> {
  if (!isValidId(activityId)) {
    throw new Error('activityId must be a positive number.');
  }

  const updatesPayload = buildActivityUpdates(updates);
  if (Object.keys(updatesPayload).length === 0) {
    return getActivityById(activityId);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('activities')
    .update(updatesPayload)
    .eq('activity_id', activityId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Activity;
}

export async function deleteActivity(activityId: number): Promise<void> {
  if (!isValidId(activityId)) {
    throw new Error('activityId must be a positive number.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('activity_id', activityId);

  if (error) {
    throw error;
  }
}
