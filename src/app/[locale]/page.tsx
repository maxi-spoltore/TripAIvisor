import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { getTripDestinationStats, getUserTrips } from '@/lib/db/queries/trips';

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
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  const session = (await auth.api.getSession({
    headers: new Headers(headers())
  })) as SessionUser | null;

  const userId = parseUserId(session);
  if (!userId) {
    redirect(`/${locale}/login`);
  }

  const trips = await getUserTrips(userId);
  const tripStats = await getTripDestinationStats(trips.map((trip) => trip.trip_id));
  const totalDestinations = Object.values(tripStats).reduce((total, stats) => total + stats.destinationCount, 0);
  const userName = session?.user?.name?.trim() ?? '';
  const welcomeMessage = userName ? tTrips('welcome', { name: userName }) : tAuth('welcomeBack');

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">{welcomeMessage}</h1>
        <p className="mt-2 text-slate-500">{tAuth('tagline')}</p>
      </div>

      <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <span className="text-3xl font-bold text-primary-600">{trips.length}</span>
            <span className="text-sm text-slate-500">{tTrips('totalTrips', { count: trips.length })}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <span className="text-3xl font-bold text-primary-600">{totalDestinations}</span>
            <span className="text-sm text-slate-500">
              {tTrips('totalDestinations', { count: totalDestinations })}
            </span>
          </CardContent>
        </Card>
      </div>

      <Link
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary-600 px-6 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        href={`/${locale}/trips`}
      >
        {tTrips('goToTrips')}
      </Link>
    </main>
  );
}
