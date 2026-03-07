'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

const STORAGE_KEY = 'tripaivisor_seen_trip_detail';

export function TripDetailHint() {
  const t = useTranslations('onboarding');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <Card className="overflow-hidden border-brand-primary/30 bg-brand-accent-soft">
      <CardContent className="flex gap-4 p-4 sm:p-5">
        <ol className="flex-1 list-inside list-decimal space-y-1.5 text-body-sm text-foreground-secondary">
          <li>{t('tripDetailStep1')}</li>
          <li>{t('tripDetailStep2')}</li>
          <li>{t('tripDetailStep3')}</li>
        </ol>
        <button
          aria-label={t('gotIt')}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:text-foreground-primary"
          onClick={dismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
