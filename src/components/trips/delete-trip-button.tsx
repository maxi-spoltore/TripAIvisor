'use client';

import { MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function DeleteTripButton() {
  const tCommon = useTranslations('common');

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(tCommon('confirmDelete'))) {
      event.preventDefault();
    }
  };

  return (
    <Button onClick={handleClick} type="submit" variant="outline">
      {tCommon('delete')}
    </Button>
  );
}
