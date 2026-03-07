'use client';

import { AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/database';
import { ACTIVITY_CATEGORY_CONFIG, formatActivityTime, getActivityPreviewField } from './activity-config';

type ActivityCardProps = {
  activity: Activity;
  hasConflict?: boolean;
  isPending?: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: number) => void;
};

function getActivityTimeLabel(activity: Activity): string | null {
  if (!activity.start_time) {
    return null;
  }

  const start = formatActivityTime(activity.start_time);
  if (!activity.end_time) {
    return start;
  }

  return `${start} - ${formatActivityTime(activity.end_time)}`;
}

export function ActivityCard({
  activity,
  hasConflict = false,
  isPending = false,
  onEdit,
  onDelete
}: ActivityCardProps) {
  const tActivities = useTranslations('activities');
  const tCommon = useTranslations('common');
  const categoryConfig = ACTIVITY_CATEGORY_CONFIG[activity.category];
  const Icon = categoryConfig.icon;
  const timeLabel = getActivityTimeLabel(activity);
  const preview = getActivityPreviewField(activity);

  return (
    <div
      className={cn(
        'rounded-lg border border-border border-l-4 bg-surface p-3 shadow-card',
        categoryConfig.borderClassName
      )}
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Icon aria-hidden="true" className={cn('mt-0.5 h-4 w-4 shrink-0', categoryConfig.iconClassName)} />
          <div className="min-w-0">
            <p className="truncate text-body-sm font-semibold text-foreground-primary">{activity.name}</p>
            {preview ? <p className="truncate text-body-sm text-foreground-secondary">{preview}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {timeLabel ? <Badge variant="outline">{timeLabel}</Badge> : null}

          {hasConflict ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex h-8 w-8 items-center justify-center text-warning" role="img">
                    <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{tActivities('timeConflict')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          <Button
            aria-label={tCommon('edit')}
            className="h-8 w-8 p-0 touch:h-10 touch:w-10"
            disabled={isPending}
            onClick={() => onEdit(activity)}
            variant="ghost"
          >
            <Edit2 aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button
            aria-label={tCommon('delete')}
            className="h-8 w-8 p-0 text-danger hover:bg-danger/10 hover:text-danger touch:h-10 touch:w-10"
            disabled={isPending}
            onClick={() => onDelete(activity.activity_id)}
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
