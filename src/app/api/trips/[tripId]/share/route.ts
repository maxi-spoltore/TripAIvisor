import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createShareLink } from '@/lib/db/queries/shares';

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
  };
};

type RouteContext = {
  params: {
    tripId: string;
  };
};

function parseUserId(session: SessionUser | null): number | null {
  const rawUserId = session?.user?.id ?? session?.user?.user_id;
  const userId = Number(rawUserId);

  return Number.isFinite(userId) ? userId : null;
}

function normalizeShareLocale(value: string | null): 'es' | 'en' {
  return value === 'en' ? 'en' : 'es';
}

export async function POST(request: Request, context: RouteContext) {
  const session = (await auth.api.getSession({
    headers: new Headers(request.headers)
  })) as SessionUser | null;

  if (!parseUserId(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tripId = Number(context.params.tripId);
  if (!Number.isFinite(tripId) || tripId <= 0) {
    return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const locale = normalizeShareLocale(requestUrl.searchParams.get('locale'));

  try {
    const share = await createShareLink(tripId, locale);
    return NextResponse.json(share);
  } catch {
    return NextResponse.json({ error: 'Could not create share link' }, { status: 500 });
  }
}
