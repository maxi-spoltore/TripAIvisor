'use client';

import { Calendar, Download, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateTripTitleAction } from '@/app/actions/trips';
import { ShareModal } from '@/components/trips/share-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExportedTrip } from '@/lib/utils/import-export';

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short'
  });
}

function calculateEndDate(startDate: string, days: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

type TripHeaderProps = {
  locale: string;
  tripId: number;
  title: string;
  startDate: string | null;
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

export function TripHeader({ locale, tripId, title, startDate, totalDays, exportData }: TripHeaderProps) {
  const tTrips = useTranslations('trips');
  const tShare = useTranslations('share');
  const [editingTitle, setEditingTitle] = useState(title);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEditingTitle(title);
  }, [title]);

  const formattedDateRange = useMemo(() => {
    if (!startDate) {
      return '';
    }

    const startLabel = formatDate(startDate, locale);
    if (totalDays <= 0) {
      return startLabel;
    }

    const endDate = calculateEndDate(startDate, totalDays);
    const endLabel = formatDate(endDate, locale);

    return `${startLabel} - ${endLabel} (${tTrips('days', { count: totalDays })})`;
  }, [locale, startDate, tTrips, totalDays]);

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
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <Input
        className="h-auto border-transparent px-0 text-3xl font-bold leading-tight shadow-none focus-visible:ring-0"
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {formattedDateRange ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            {formattedDateRange}
          </p>
        ) : null}

        <div className={`flex gap-2 ${formattedDateRange ? 'ml-auto' : ''}`}>
          <Button onClick={handleExportTrip} type="button" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {tTrips('export')}
          </Button>
          <Button onClick={() => setIsShareModalOpen(true)} type="button" variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            {tShare('open')}
          </Button>
        </div>
      </div>

      <ShareModal locale={locale} onClose={() => setIsShareModalOpen(false)} open={isShareModalOpen} tripId={tripId} />
    </div>
  );
}
