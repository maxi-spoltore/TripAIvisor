import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Calendar, MapPin, Share2 } from 'lucide-react';
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
  const tOnboarding = await getTranslations({ locale, namespace: 'onboarding' });

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
        <h1 className="text-3xl font-semibold text-foreground-primary">{welcomeMessage}</h1>
        <p className="mt-2 text-foreground-muted">{tAuth('tagline')}</p>
      </div>

      {trips.length === 0 ? (
        <>
          <Card className="w-full max-w-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-brand-route via-brand-primary to-brand-accent" />
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-title-md text-foreground-primary">{tOnboarding('welcomeTitle')}</h2>
              <p className="text-body-sm text-foreground-secondary">{tOnboarding('welcomeDescription')}</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-body-sm text-foreground-secondary">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-brand-primary" />
                  {tOnboarding('featureDestinations')}
                </li>
                <li className="flex items-center gap-3 text-body-sm text-foreground-secondary">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-brand-primary" />
                  {tOnboarding('featureDates')}
                </li>
                <li className="flex items-center gap-3 text-body-sm text-foreground-secondary">
                  <Share2 className="h-4 w-4 flex-shrink-0 text-brand-primary" />
                  {tOnboarding('featureShare')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
            href={`/${locale}/trips/new`}
          >
            {tOnboarding('createFirstTrip')}
          </Link>
        </>
      ) : (
        <>
          <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col items-center p-6">
                <span className="text-3xl font-bold text-brand-primary">{trips.length}</span>
                <span className="text-sm text-foreground-muted">{tTrips('totalTrips', { count: trips.length })}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6">
                <span className="text-3xl font-bold text-brand-primary">{totalDestinations}</span>
                <span className="text-sm text-foreground-muted">
                  {tTrips('totalDestinations', { count: totalDestinations })}
                </span>
              </CardContent>
            </Card>
          </div>

          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
            href={`/${locale}/trips`}
          >
            {tTrips('goToTrips')}
          </Link>
        </>
      )}
    </main>
  );
}
