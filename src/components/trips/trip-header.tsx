'use client';

import { Download, Share2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateTripDatesAction, updateTripTitleAction } from '@/app/actions/trips';
import { ShareModal } from '@/components/trips/share-modal';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { calculateDate, daysBetween, validateEndDate } from '@/lib/utils/dates';
import type { ExportedTrip } from '@/lib/utils/import-export';

type TripHeaderProps = {
  locale: string;
  tripId: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  exportData: ExportedTrip;
};

function buildExportFileName(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${normalized || 'trip'}.json`;
}

export function TripHeader({ locale, tripId, title, startDate, endDate, totalDays, exportData }: TripHeaderProps) {
  const tTrips = useTranslations('trips');
  const tShare = useTranslations('share');
  const [editingTitle, setEditingTitle] = useState(title);
  const [localStartDate, setLocalStartDate] = useState(startDate ?? '');
  const [localEndDate, setLocalEndDate] = useState(endDate ?? '');
  const [dateError, setDateError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEditingTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalStartDate(startDate ?? '');
    setLocalEndDate(endDate ?? '');
    setDateError(null);
  }, [startDate, endDate]);

  const saveTitle = () => {
    const normalizedTitle = editingTitle.trim() || tTrips('defaultTitle');

    if (normalizedTitle === title) {
      if (normalizedTitle !== editingTitle) {
        setEditingTitle(normalizedTitle);
      }
      return;
    }

    setEditingTitle(normalizedTitle);

    startTransition(async () => {
      await updateTripTitleAction({
        locale,
        tripId,
        title: normalizedTitle
      });
    });
  };

  const getDateErrorMessage = (error: 'endDateBeforeStart' | 'endDateCollision'): string => {
    if (error === 'endDateBeforeStart') {
      return tTrips('endDateBeforeStart');
    }

    return tTrips('endDateTooEarly', { days: totalDays });
  };

  const saveDates = (nextStartDate: string | null, nextEndDate: string | null) => {
    startTransition(async () => {
      await updateTripDatesAction({
        locale,
        tripId,
        startDate: nextStartDate,
        endDate: nextEndDate
      });
    });
  };

  const handleStartDateChange = (newStartDate: string) => {
    setLocalStartDate(newStartDate);

    if (!newStartDate) {
      setLocalEndDate('');
      setDateError(null);
      saveDates(null, null);
      return;
    }

    if (localEndDate && localStartDate) {
      const delta = daysBetween(localStartDate, newStartDate);
      const shiftedEndDate = calculateDate(localEndDate, delta);

      if (shiftedEndDate) {
        const result = validateEndDate(newStartDate, shiftedEndDate, totalDays);
        if (!result.valid && result.error) {
          setDateError(getDateErrorMessage(result.error));
          return;
        }

        setLocalEndDate(shiftedEndDate);
        setDateError(null);
        saveDates(newStartDate, shiftedEndDate);
        return;
      }
    }

    setDateError(null);
    saveDates(newStartDate, localEndDate || null);
  };

  const handleEndDateChange = (newEndDate: string) => {
    setLocalEndDate(newEndDate);

    if (!newEndDate) {
      setDateError(null);
      saveDates(localStartDate || null, null);
      return;
    }

    if (!localStartDate) {
      setDateError(tTrips('setStartDateFirst'));
      return;
    }

    const result = validateEndDate(localStartDate, newEndDate, totalDays);
    if (!result.valid && result.error) {
      setDateError(getDateErrorMessage(result.error));
      return;
    }

    setDateError(null);
    saveDates(localStartDate, newEndDate);
  };

  const handleExportTrip = () => {
    const exportJson = JSON.stringify(exportData, null, 2);
    const blob = new Blob([exportJson], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = buildExportFileName(exportData.title);
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="h-1.5 bg-gradient-to-r from-brand-route via-brand-primary to-brand-accent" />

      <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="group relative space-y-2">
          <p className="text-label-sm uppercase tracking-[0.03em] text-foreground-muted">
            {tTrips('summary')}
          </p>
          <Input
            className="h-auto border-transparent bg-transparent px-0 py-0 font-display text-display-md font-bold leading-tight text-foreground-primary shadow-none focus-visible:border-transparent focus-visible:ring-0"
            disabled={isPending}
            onBlur={saveTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            placeholder={tTrips('defaultTitle')}
            value={editingTitle}
          />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-primary/30 opacity-0 transition-opacity duration-fast ease-standard group-hover:opacity-100" />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-elevated p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3 space-x-2">
              <label className="text-label-md text-foreground-muted" htmlFor="trip-start-date">
                {tTrips('startDateLabel')}
              </label>
              <DatePicker
                disabled={isPending}
                id="trip-start-date"
                locale={locale}
                onChange={handleStartDateChange}
                placeholder={tTrips('startDateLabel')}
                value={localStartDate}
              />
            </div>

            <div className="space-y-3 space-x-2">
              <label className="text-label-md text-foreground-muted" htmlFor="trip-end-date">
                {tTrips('endDateLabel')}
              </label>
              <DatePicker
                disabled={isPending}
                id="trip-end-date"
                locale={locale}
                onChange={handleEndDateChange}
                placeholder={tTrips('endDateLabel')}
                value={localEndDate}
              />
            </div>
          </div>

          {totalDays > 0 ? (
            <span className="inline-flex w-fit rounded-pill bg-brand-accent-soft px-3 py-1 text-label-md font-semibold text-brand-primary">
              {tTrips('days', { count: totalDays })}
            </span>
          ) : null}

          {dateError ? <p className="text-body-sm text-danger">{dateError}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button className="w-full sm:w-auto" onClick={handleExportTrip} size="sm" type="button" variant="outline">
            <Download aria-hidden="true" className="mr-2 h-4 w-4" />
            {tTrips('export')}
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => setIsShareModalOpen(true)} size="sm" type="button" variant="outline">
            <Share2 aria-hidden="true" className="mr-2 h-4 w-4" />
            {tShare('open')}
          </Button>
        </div>
      </div>

      <ShareModal locale={locale} onClose={() => setIsShareModalOpen(false)} open={isShareModalOpen} tripId={tripId} />
    </div>
  );
}
