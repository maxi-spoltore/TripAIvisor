'use client';

import { Download, Share2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateTripDatesAction, updateTripTitleAction } from '@/app/actions/trips';
import { ShareModal } from '@/components/trips/share-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateEndDate } from '@/lib/utils/dates';
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

    if (localEndDate) {
      const result = validateEndDate(newStartDate, localEndDate, totalDays);

      if (!result.valid && result.error) {
        setDateError(getDateErrorMessage(result.error));
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
      <div className="p-6">
        <div className="group relative">
          <Input
            className="h-auto border-transparent px-0 text-3xl font-bold leading-tight shadow-none focus-visible:ring-0 focus-visible:border-primary-300"
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
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-200 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor="trip-start-date">
              {tTrips('startDateLabel')}
            </label>
            <input
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              disabled={isPending}
              id="trip-start-date"
              onChange={(event) => handleStartDateChange(event.target.value)}
              type="date"
              value={localStartDate}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor="trip-end-date">
              {tTrips('endDateLabel')}
            </label>
            <input
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              disabled={isPending}
              id="trip-end-date"
              onChange={(event) => handleEndDateChange(event.target.value)}
              type="date"
              value={localEndDate}
            />
          </div>

          {totalDays > 0 ? (
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              {tTrips('days', { count: totalDays })}
            </span>
          ) : null}

          <div className="ml-auto flex gap-2">
            <Button onClick={handleExportTrip} type="button" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {tTrips('export')}
            </Button>
            <Button onClick={() => setIsShareModalOpen(true)} type="button" variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              {tShare('open')}
            </Button>
          </div>
        </div>

        {dateError ? <p className="mt-2 text-sm text-red-600">{dateError}</p> : null}
      </div>

      <ShareModal locale={locale} onClose={() => setIsShareModalOpen(false)} open={isShareModalOpen} tripId={tripId} />
    </div>
  );
}
