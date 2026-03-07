'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  createActivity,
  deleteActivity,
  updateActivity
} from '@/lib/db/queries/activities';
import type { Activity, ActivityCategory } from '@/types/database';

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
  };
};

type CreateActivityActionInput = {
  locale: string;
  tripId: number;
  destinationId: number;
  category: ActivityCategory;
  name: string;
  day_number: number;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  details?: Record<string, unknown>;
};

type UpdateActivityActionInput = {
  locale: string;
  tripId: number;
  activityId: number;
  category?: ActivityCategory;
  name?: string;
  day_number?: number;
  start_time?: string | null;
  end_time?: string | null;
  position?: number;
  notes?: string | null;
  details?: Record<string, unknown>;
};

type DeleteActivityActionInput = {
  locale: string;
  tripId: number;
  activityId: number;
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

function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export async function createActivityAction(input: CreateActivityActionInput): Promise<Activity> {
  const { locale, tripId, destinationId, ...activityInput } = input;

  await requireUserId(locale);

  if (!isValidId(tripId) || !isValidId(destinationId)) {
    throw new Error('Invalid activity create payload.');
  }

  const activity = await createActivity({
    destination_id: destinationId,
    ...activityInput
  });

  revalidateTripPaths(locale, tripId);
  return activity;
}

export async function updateActivityAction(input: UpdateActivityActionInput): Promise<Activity> {
  const { locale, tripId, activityId, ...updates } = input;

  await requireUserId(locale);

  if (!isValidId(tripId) || !isValidId(activityId)) {
    throw new Error('Invalid activity update payload.');
  }

  const activity = await updateActivity(activityId, updates);
  revalidateTripPaths(locale, tripId);
  return activity;
}

export async function deleteActivityAction(input: DeleteActivityActionInput): Promise<void> {
  const { locale, tripId, activityId } = input;

  await requireUserId(locale);

  if (!isValidId(tripId) || !isValidId(activityId)) {
    throw new Error('Invalid activity delete payload.');
  }

  await deleteActivity(activityId);
  revalidateTripPaths(locale, tripId);
}
