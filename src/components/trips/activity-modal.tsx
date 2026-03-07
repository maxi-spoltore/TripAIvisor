'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { parseActivityTimeToMinutes } from './activity-config';
import type { Activity, ActivityCategory } from '@/types/database';

type ActivityModalProps = {
  activity: Activity | null;
  category: ActivityCategory;
  dayNumber: number;
  destinationId: number;
  open: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onSave: (payload: ActivityModalSubmitInput) => void;
};

export type ActivityModalSubmitInput = {
  activityId?: number;
  destinationId: number;
  category: ActivityCategory;
  name: string;
  day_number: number;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  details: Record<string, unknown>;
};

type ActivityDetailField = {
  key: string;
  labelKey: string;
  type?: 'text' | 'time' | 'url' | 'select';
  options?: Array<{ value: string; labelKey: string }>;
};

type ActivityModalFormState = {
  name: string;
  start_time: string;
  end_time: string;
  notes: string;
  details: Record<string, string>;
};

const EMPTY_TOUR_TYPE = '__none__';

const CATEGORY_FIELDS: Record<ActivityCategory, ActivityDetailField[]> = {
  meal: [
    { key: 'restaurant_name', labelKey: 'restaurantName' },
    { key: 'cuisine', labelKey: 'cuisine' },
    { key: 'reservation_time', labelKey: 'reservationTime', type: 'time' },
    { key: 'reservation_code', labelKey: 'reservationCode' },
    { key: 'address', labelKey: 'address' }
  ],
  tour: [
    { key: 'tour_company', labelKey: 'tourCompany' },
    { key: 'meeting_point', labelKey: 'meetingPoint' },
    { key: 'guide_contact', labelKey: 'guideContact' },
    {
      key: 'tour_type',
      labelKey: 'tourType',
      type: 'select',
      options: [
        { value: 'walking', labelKey: 'tourTypeWalking' },
        { value: 'bus', labelKey: 'tourTypeBus' },
        { value: 'boat', labelKey: 'tourTypeBoat' },
        { value: 'bike', labelKey: 'tourTypeBike' },
        { value: 'other', labelKey: 'tourTypeOther' }
      ]
    }
  ],
  ticketed: [
    { key: 'venue', labelKey: 'venue' },
    { key: 'ticket_number', labelKey: 'ticketNumber' },
    { key: 'booking_code', labelKey: 'bookingCode' },
    { key: 'booking_link', labelKey: 'bookingLink', type: 'url' },
    { key: 'address', labelKey: 'address' }
  ],
  general: [
    { key: 'location', labelKey: 'location' },
    { key: 'description', labelKey: 'description' }
  ]
};

function toInputValue(value: string | null): string {
  return value ?? '';
}

function toDetailInputValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNullable(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function buildInitialDetails(category: ActivityCategory, details: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of CATEGORY_FIELDS[category]) {
    values[field.key] = toDetailInputValue(details[field.key]);
  }

  return values;
}

function buildSubmitDetails(details: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    const normalized = toNullable(value);
    if (normalized) {
      payload[key] = normalized;
    }
  }

  return payload;
}

export function ActivityModal({
  activity,
  category,
  dayNumber,
  destinationId,
  open,
  isPending = false,
  onCancel,
  onSave
}: ActivityModalProps) {
  const tActivities = useTranslations('activities');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const [formState, setFormState] = useState<ActivityModalFormState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      return;
    }

    setFormState({
      name: activity?.name ?? '',
      start_time: toInputValue(activity?.start_time ?? null),
      end_time: toInputValue(activity?.end_time ?? null),
      notes: toInputValue(activity?.notes ?? null),
      details: buildInitialDetails(category, activity?.details ?? {})
    });
    setErrorMessage(null);
  }, [activity, category, open]);

  if (!open || !formState) {
    return null;
  }

  const fields = CATEGORY_FIELDS[category];

  const handleSubmit = () => {
    const name = formState.name.trim();
    if (!name) {
      setErrorMessage(tErrors('activityNameRequired'));
      return;
    }

    const startTime = toNullable(formState.start_time);
    const endTime = toNullable(formState.end_time);

    if (startTime && endTime) {
      const startMinutes = parseActivityTimeToMinutes(startTime);
      const endMinutes = parseActivityTimeToMinutes(endTime);
      if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
        setErrorMessage(tErrors('activityTimeRangeInvalid'));
        return;
      }
    }

    setErrorMessage(null);

    onSave({
      activityId: activity?.activity_id,
      destinationId,
      category,
      name,
      day_number: dayNumber,
      start_time: startTime,
      end_time: endTime,
      notes: toNullable(formState.notes),
      details: buildSubmitDetails(formState.details)
    });
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          onCancel();
        }
      }}
      open={open}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{activity ? tActivities('editActivity') : tActivities('addActivity')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="activity-name">{tActivities('name')}</Label>
            <Input
              disabled={isPending}
              id="activity-name"
              onChange={(event) => setFormState((previous) => previous ? { ...previous, name: event.target.value } : previous)}
              placeholder={tActivities('namePlaceholder')}
              value={formState.name}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="activity-start-time">{tActivities('startTime')}</Label>
              <Input
                disabled={isPending}
                id="activity-start-time"
                onChange={(event) => setFormState((previous) => previous ? { ...previous, start_time: event.target.value } : previous)}
                type="time"
                value={formState.start_time}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-end-time">{tActivities('endTime')}</Label>
              <Input
                disabled={isPending}
                id="activity-end-time"
                onChange={(event) => setFormState((previous) => previous ? { ...previous, end_time: event.target.value } : previous)}
                type="time"
                value={formState.end_time}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-notes">{tActivities('notes')}</Label>
            <Textarea
              disabled={isPending}
              id="activity-notes"
              onChange={(event) => setFormState((previous) => previous ? { ...previous, notes: event.target.value } : previous)}
              placeholder={tActivities('notesPlaceholder')}
              rows={3}
              value={formState.notes}
            />
          </div>

          <details className="rounded-lg border border-border bg-surface" open>
            <summary className="cursor-pointer px-3 py-2 text-body-sm font-semibold text-foreground-primary">
              {tActivities('details')}
            </summary>
            <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div className="space-y-1.5" key={field.key}>
                  <Label htmlFor={`activity-detail-${field.key}`}>{tActivities(field.labelKey)}</Label>

                  {field.type === 'select' && field.options ? (
                    <Select
                      disabled={isPending}
                      onValueChange={(value) => {
                        setFormState((previous) => {
                          if (!previous) {
                            return previous;
                          }

                          return {
                            ...previous,
                            details: {
                              ...previous.details,
                              [field.key]: value === EMPTY_TOUR_TYPE ? '' : value
                            }
                          };
                        });
                      }}
                      value={formState.details[field.key] || EMPTY_TOUR_TYPE}
                    >
                      <SelectTrigger id={`activity-detail-${field.key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_TOUR_TYPE}>{tActivities('none')}</SelectItem>
                        {field.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {tActivities(option.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      disabled={isPending}
                      id={`activity-detail-${field.key}`}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setFormState((previous) => {
                          if (!previous) {
                            return previous;
                          }

                          return {
                            ...previous,
                            details: {
                              ...previous.details,
                              [field.key]: nextValue
                            }
                          };
                        });
                      }}
                      type={field.type === 'time' ? 'time' : field.type === 'url' ? 'url' : 'text'}
                      value={formState.details[field.key] ?? ''}
                    />
                  )}
                </div>
              ))}
            </div>
          </details>

          {errorMessage ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-body-sm text-danger">{errorMessage}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button disabled={isPending} onClick={onCancel} variant="outline">
            {tCommon('cancel')}
          </Button>
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {tCommon('saving')}
              </>
            ) : (
              tCommon('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
