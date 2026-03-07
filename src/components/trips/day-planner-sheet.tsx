'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { Activity } from '@/types/database';
import { DayPlanner } from './day-planner';

type DayPlannerSheetProps = {
  destinationName: string;
  destinationId: number;
  tripId: number;
  locale: string;
  duration: number;
  activities: Activity[];
  startDate: string | null;
  onClose: () => void;
};

export function DayPlannerSheet({
  destinationName,
  destinationId,
  tripId,
  locale,
  duration,
  activities,
  startDate,
  onClose
}: DayPlannerSheetProps) {
  const tActivities = useTranslations('activities');

  return (
    <Dialog onOpenChange={(open) => { if (!open) onClose(); }} open>
      <DialogContent className="fixed inset-0 left-0 top-auto bottom-0 h-[calc(100dvh-2rem)] w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none p-0 animate-slide-from-bottom data-[state=open]:animate-slide-from-bottom sm:max-h-none max-sm:max-h-none">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-border bg-surface px-4 py-3 mb-0">
          <div>
            <DialogTitle>{tActivities('scheduleFor', { destination: destinationName })}</DialogTitle>
            <DialogDescription className="sr-only">
              {tActivities('scheduleFor', { destination: destinationName })}
            </DialogDescription>
          </div>
          <DialogClose className="rounded-md p-1.5 text-foreground-secondary hover:bg-subtle hover:text-foreground-primary transition-colors duration-fast">
            <X className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>
        <div className="overflow-y-auto px-4 pb-6 pt-4">
          <DayPlanner
            activities={activities}
            destinationId={destinationId}
            duration={duration}
            locale={locale}
            startDate={startDate}
            tripId={tripId}
            variant="sheet"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
