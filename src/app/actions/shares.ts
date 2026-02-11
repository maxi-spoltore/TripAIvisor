'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createShareLink, deactivateShareLink } from '@/lib/db/queries/shares';

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
  };
};

function parseUserId(session: SessionUser | null): number | null {
  const rawUserId = session?.user?.id ?? session?.user?.user_id;
  const userId = Number(rawUserId);

  return Number.isFinite(userId) ? userId : null;
}

function normalizeShareLocale(locale: string): 'es' | 'en' {
  return locale === 'en' ? 'en' : 'es';
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

export async function createShareLinkAction(input: {
  locale: string;
  tripId: number;
}): Promise<{ shareUrl: string; shareToken: string }> {
  const locale = normalizeShareLocale(input.locale);

  await requireUserId(locale);

  if (!Number.isFinite(input.tripId) || input.tripId <= 0) {
    throw new Error('Invalid trip id.');
  }

  return createShareLink(input.tripId, locale);
}

export async function deactivateShareLinkAction(input: {
  locale: string;
  shareId: number;
}): Promise<void> {
  const locale = normalizeShareLocale(input.locale);

  await requireUserId(locale);

  if (!Number.isFinite(input.shareId) || input.shareId <= 0) {
    throw new Error('Invalid share id.');
  }

  await deactivateShareLink(input.shareId);
}
