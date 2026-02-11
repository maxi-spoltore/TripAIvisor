'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const t = useTranslations('auth');

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: 'google'
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="mb-4 text-xl font-semibold">{t('signIn')}</h1>
        <Button className="w-full" onClick={handleGoogleLogin} type="button">
          {t('continueWithGoogle')}
        </Button>
      </div>
    </main>
  );
}
