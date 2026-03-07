import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

type DashboardPageProps = {
  params: {
    locale: string;
  };
};

type SessionUser = {
  user?: {
    id?: number | string;
    user_id?: number | string;
    name?: string | null;
  };
};

function parseUserId(session: SessionUser | null): number | null {
  const rawUserId = session?.user?.id ?? session?.user?.user_id;
  const userId = Number(rawUserId);

  return Number.isFinite(userId) ? userId : null;
}

export default async function LocaleDashboardPage({ params }: DashboardPageProps) {
  const { locale } = params;
  const session = (await auth.api.getSession({
    headers: new Headers(headers())
  })) as SessionUser | null;

  const userId = parseUserId(session);
  if (!userId) {
    redirect(`/${locale}/login`);
  }
  redirect(`/${locale}/trips`);
}
