'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ActivityCategory } from '@/types/database';
import { ACTIVITY_CATEGORIES, ACTIVITY_CATEGORY_CONFIG } from './activity-config';

type ActivityCategoryPickerProps = {
  onSelect: (category: ActivityCategory) => void;
  disabled?: boolean;
};

export function ActivityCategoryPicker({ onSelect, disabled = false }: ActivityCategoryPickerProps) {
  const tActivities = useTranslations('activities');

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ACTIVITY_CATEGORIES.map((category) => {
        const categoryConfig = ACTIVITY_CATEGORY_CONFIG[category];
        const Icon = categoryConfig.icon;

        return (
          <Button
            className="h-auto flex-col gap-2 border border-border bg-surface px-3 py-3 text-body-sm text-foreground-primary"
            disabled={disabled}
            key={category}
            onClick={() => onSelect(category)}
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden="true" className={cn('h-4 w-4', categoryConfig.iconClassName)} />
            <span className="text-center">{tActivities(category)}</span>
          </Button>
        );
      })}
    </div>
  );
}
