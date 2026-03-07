'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  createActivityAction,
  deleteActivityAction,
  updateActivityAction
} from '@/app/actions/activities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateDate, formatDate } from '@/lib/utils/dates';
import type { Activity, ActivityCategory } from '@/types/database';
import { ActivityCard } from './activity-card';
import { ActivityCategoryPicker } from './activity-category-picker';
import { ACTIVITY_CATEGORIES, parseActivityTimeToMinutes } from './activity-config';
import { ActivityModal, type ActivityModalSubmitInput } from './activity-modal';

type DayPlannerProps = {
  destinationId: number;
  tripId: number;
  locale: string;
  duration: number;
  activities: Activity[];
  startDate: string | null;
  variant?: 'inline' | 'sheet';
};

function getNextPosition(activities: Activity[], dayNumber: number): number {
  let maxPosition = -1;

  for (const activity of activities) {
    if (activity.day_number === dayNumber && activity.position > maxPosition) {
      maxPosition = activity.position;
    }
  }

  return maxPosition + 1;
}

function sortActivitiesForDay(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const aHasStart = Boolean(a.start_time);
    const bHasStart = Boolean(b.start_time);

    if (aHasStart && bHasStart) {
      const timeDelta = parseActivityTimeToMinutes(a.start_time!) - parseActivityTimeToMinutes(b.start_time!);
      if (timeDelta !== 0) {
        return timeDelta;
      }

      return a.position - b.position;
    }

    if (aHasStart !== bHasStart) {
      return aHasStart ? -1 : 1;
    }

    return a.position - b.position;
  });
}

export function findConflictingActivityIds(activities: Activity[]): Set<number> {
  const conflictIds = new Set<number>();

  for (let i = 0; i < activities.length; i += 1) {
    const a = activities[i];
    if (!a.start_time || !a.end_time) {
      continue;
    }

    const aStart = parseActivityTimeToMinutes(a.start_time);
    const aEnd = parseActivityTimeToMinutes(a.end_time);
    if (Number.isNaN(aStart) || Number.isNaN(aEnd) || aEnd <= aStart) {
      continue;
    }

    for (let j = i + 1; j < activities.length; j += 1) {
      const b = activities[j];
      if (!b.start_time || !b.end_time) {
        continue;
      }

      const bStart = parseActivityTimeToMinutes(b.start_time);
      const bEnd = parseActivityTimeToMinutes(b.end_time);
      if (Number.isNaN(bStart) || Number.isNaN(bEnd) || bEnd <= bStart) {
        continue;
      }

      if (aStart < bEnd && bStart < aEnd) {
        conflictIds.add(a.activity_id);
        conflictIds.add(b.activity_id);
      }
    }
  }

  return conflictIds;
}

export function DayPlanner({
  destinationId,
  tripId,
  locale,
  duration,
  activities,
  startDate,
  variant = 'inline'
}: DayPlannerProps) {
  const tActivities = useTranslations('activities');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const [localActivities, setLocalActivities] = useState<Activity[]>(activities);
  const [selectedDay, setSelectedDay] = useState('1');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState<ActivityCategory>('general');
  const [quickAddStartTime, setQuickAddStartTime] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<ActivityCategory>('general');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const optimisticIdRef = useRef(-1);

  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  useEffect(() => {
    if (duration < 1) {
      return;
    }

    const currentDay = Number(selectedDay);
    if (!Number.isInteger(currentDay) || currentDay < 1 || currentDay > duration) {
      setSelectedDay('1');
    }
  }, [duration, selectedDay]);

  const dayNumbers = useMemo(() => Array.from({ length: Math.max(duration, 1) }, (_, index) => index + 1), [duration]);
  const selectedDayNumber = Number(selectedDay) || 1;

  const activityCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const day of dayNumbers) {
      counts.set(day, 0);
    }

    for (const activity of localActivities) {
      counts.set(activity.day_number, (counts.get(activity.day_number) ?? 0) + 1);
    }

    return counts;
  }, [dayNumbers, localActivities]);

  const selectedDayActivities = useMemo(
    () =>
      sortActivitiesForDay(
        localActivities.filter((activity) => activity.day_number === selectedDayNumber)
      ),
    [localActivities, selectedDayNumber]
  );

  const conflictIds = useMemo(() => findConflictingActivityIds(selectedDayActivities), [selectedDayActivities]);

  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';

  const closeModal = useCallback(() => {
    if (isPending) {
      return;
    }

    setModalOpen(false);
    setEditingActivity(null);
  }, [isPending]);

  const handleSelectCategory = useCallback((category: ActivityCategory) => {
    setModalCategory(category);
    setEditingActivity(null);
    setShowCategoryPicker(false);
    setModalOpen(true);
    setErrorMessage(null);
  }, []);

  const handleQuickAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = quickAddName.trim();
    if (!name) {
      setErrorMessage(tErrors('activityNameRequired'));
      return;
    }

    const startTime = quickAddStartTime || null;
    const quickCategory = quickAddCategory;
    const tempId = optimisticIdRef.current;
    optimisticIdRef.current -= 1;

    const optimisticActivity: Activity = {
      activity_id: tempId,
      destination_id: destinationId,
      category: quickCategory,
      name,
      day_number: selectedDayNumber,
      start_time: startTime,
      end_time: null,
      position: getNextPosition(localActivities, selectedDayNumber),
      notes: null,
      details: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setErrorMessage(null);
    setLocalActivities((previous) => [...previous, optimisticActivity]);
    setQuickAddName('');
    setQuickAddCategory('general');
    setQuickAddStartTime('');

    startTransition(async () => {
      try {
        const created = await createActivityAction({
          locale,
          tripId,
          destinationId,
          category: quickCategory,
          name,
          day_number: selectedDayNumber,
          start_time: startTime,
          end_time: null,
          notes: null,
          details: {}
        });

        setLocalActivities((previous) =>
          previous.map((activity) => (activity.activity_id === tempId ? created : activity))
        );
      } catch {
        setLocalActivities((previous) => previous.filter((activity) => activity.activity_id !== tempId));
        setQuickAddName(name);
        setQuickAddCategory(quickCategory);
        setQuickAddStartTime(startTime ?? '');
        setErrorMessage(tErrors('saveActivity'));
      }
    });
  };

  const handleModalSave = (payload: ActivityModalSubmitInput) => {
    setErrorMessage(null);

    if (payload.activityId) {
      const previousActivities = localActivities;
      const existing = previousActivities.find((activity) => activity.activity_id === payload.activityId);
      if (!existing) {
        return;
      }

      const optimisticUpdated: Activity = {
        ...existing,
        category: payload.category,
        name: payload.name,
        day_number: payload.day_number,
        start_time: payload.start_time,
        end_time: payload.end_time,
        notes: payload.notes,
        details: payload.details,
        updated_at: new Date().toISOString()
      };

      setLocalActivities((previous) =>
        previous.map((activity) =>
          activity.activity_id === payload.activityId ? optimisticUpdated : activity
        )
      );
      setSelectedDay(String(payload.day_number));
      setModalOpen(false);
      setEditingActivity(null);

      startTransition(async () => {
        try {
          const updated = await updateActivityAction({
            locale,
            tripId,
            activityId: payload.activityId!,
            category: payload.category,
            name: payload.name,
            day_number: payload.day_number,
            start_time: payload.start_time,
            end_time: payload.end_time,
            notes: payload.notes,
            details: payload.details
          });

          setLocalActivities((previous) =>
            previous.map((activity) => (activity.activity_id === payload.activityId ? updated : activity))
          );
        } catch {
          setLocalActivities(previousActivities);
          setErrorMessage(tErrors('saveActivity'));
        }
      });

      return;
    }

    const tempId = optimisticIdRef.current;
    optimisticIdRef.current -= 1;

    const optimisticActivity: Activity = {
      activity_id: tempId,
      destination_id: payload.destinationId,
      category: payload.category,
      name: payload.name,
      day_number: payload.day_number,
      start_time: payload.start_time,
      end_time: payload.end_time,
      position: getNextPosition(localActivities, payload.day_number),
      notes: payload.notes,
      details: payload.details,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setLocalActivities((previous) => [...previous, optimisticActivity]);
    setSelectedDay(String(payload.day_number));
    setModalOpen(false);
    setEditingActivity(null);

    startTransition(async () => {
      try {
        const created = await createActivityAction({
          locale,
          tripId,
          destinationId: payload.destinationId,
          category: payload.category,
          name: payload.name,
          day_number: payload.day_number,
          start_time: payload.start_time,
          end_time: payload.end_time,
          notes: payload.notes,
          details: payload.details
        });

        setLocalActivities((previous) =>
          previous.map((activity) => (activity.activity_id === tempId ? created : activity))
        );
      } catch {
        setLocalActivities((previous) => previous.filter((activity) => activity.activity_id !== tempId));
        setErrorMessage(tErrors('saveActivity'));
      }
    });
  };

  const handleEditActivity = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setModalCategory(activity.category);
    setSelectedDay(String(activity.day_number));
    setShowCategoryPicker(false);
    setModalOpen(true);
    setErrorMessage(null);
  }, []);

  const handleDeleteActivity = useCallback(
    (activityId: number) => {
      const previousActivities = localActivities;
      setLocalActivities((previous) => previous.filter((activity) => activity.activity_id !== activityId));
      setErrorMessage(null);

      startTransition(async () => {
        try {
          await deleteActivityAction({
            locale,
            tripId,
            activityId
          });
        } catch {
          setLocalActivities(previousActivities);
          setErrorMessage(tErrors('deleteActivity'));
        }
      });
    },
    [localActivities, locale, tripId, tErrors]
  );

  if (duration < 1) {
    return null;
  }

  const isSheet = variant === 'sheet';

  const daySelector = isSheet ? (
    <Select onValueChange={setSelectedDay} value={selectedDay}>
      <SelectTrigger>
        <SelectValue placeholder={tActivities('selectDay')} />
      </SelectTrigger>
      <SelectContent>
        {dayNumbers.map((dayNumber) => {
          const dayDate = startDate ? calculateDate(startDate, dayNumber - 1) : null;
          const formattedDate = dayDate ? formatDate(dayDate, localeTag) : null;
          const count = activityCounts.get(dayNumber) ?? 0;

          return (
            <SelectItem key={dayNumber} value={String(dayNumber)}>
              {tActivities('day', { number: dayNumber })} - {formattedDate ?? tCommon('noDateSet')} ({tActivities('activitiesCount', { count })})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  ) : (
    <div className="relative">
      <TabsList className="flex h-auto w-full gap-2 overflow-x-auto snap-x snap-mandatory bg-transparent p-0 pb-2 md:grid md:grid-cols-4 lg:grid-cols-6">
        {dayNumbers.map((dayNumber) => {
          const dayDate = startDate ? calculateDate(startDate, dayNumber - 1) : null;
          const formattedDate = dayDate ? formatDate(dayDate, localeTag) : null;

          return (
            <TabsTrigger
              className="h-auto min-h-16 flex-col items-start gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-left data-[state=active]:border-brand-primary data-[state=active]:bg-brand-accent-soft snap-start shrink-0 w-36 md:w-auto"
              key={dayNumber}
              value={String(dayNumber)}
            >
              <span className="text-body-sm font-semibold text-foreground-primary">
                {tActivities('day', { number: dayNumber })}
              </span>
              <div className="flex w-full items-center gap-2 text-label-sm text-foreground-secondary">
                <span>{formattedDate ?? tCommon('noDateSet')}</span>
                <Badge className="ml-auto" variant="outline">
                  {activityCounts.get(dayNumber) ?? 0}
                </Badge>
              </div>
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-elevated to-transparent md:hidden" />
    </div>
  );

  const activitiesContent = (
    <>
      {selectedDayActivities.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong bg-surface p-4 text-body-sm text-foreground-secondary">
          {tActivities('noActivities')}
        </p>
      ) : (
        <div className="space-y-2">
          {selectedDayActivities.map((activity) => (
            <ActivityCard
              activity={activity}
              hasConflict={conflictIds.has(activity.activity_id)}
              isPending={isPending}
              key={activity.activity_id}
              onDelete={handleDeleteActivity}
              onEdit={handleEditActivity}
            />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="mb-2 text-body-sm font-semibold text-foreground-primary">{tActivities('quickAdd')}</p>
        <form className={isSheet ? 'flex flex-col gap-2' : 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_9rem_auto]'} onSubmit={handleQuickAdd}>
          <Input
            disabled={isPending}
            onChange={(event) => setQuickAddName(event.target.value)}
            placeholder={tActivities('namePlaceholder')}
            value={quickAddName}
          />

          <div className={isSheet ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-2 sm:contents'}>
            <Select
              disabled={isPending}
              onValueChange={(value) => setQuickAddCategory(value as ActivityCategory)}
              value={quickAddCategory}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {tActivities(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              disabled={isPending}
              onChange={(event) => setQuickAddStartTime(event.target.value)}
              type="time"
              value={quickAddStartTime}
            />
          </div>

          <Button className={isSheet ? 'w-full' : ''} disabled={isPending} type="submit">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {tCommon('saving')}
              </>
            ) : (
              tCommon('add')
            )}
          </Button>
        </form>
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border-strong bg-surface p-3">
        <Button
          className="w-full sm:w-auto"
          disabled={isPending}
          onClick={() => setShowCategoryPicker((previous) => !previous)}
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          {tActivities('addActivity')}
        </Button>

        {showCategoryPicker ? (
          <ActivityCategoryPicker disabled={isPending} onSelect={handleSelectCategory} />
        ) : null}
      </div>
    </>
  );

  return (
    <section className={isSheet ? 'space-y-4' : 'space-y-4 rounded-xl border border-border bg-elevated p-4'}>
      {errorMessage ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-body-sm text-danger">{errorMessage}</p>
      ) : null}

      {isSheet ? (
        <>
          {daySelector}
          <div className="space-y-3">{activitiesContent}</div>
        </>
      ) : (
        <Tabs onValueChange={setSelectedDay} value={selectedDay}>
          {daySelector}
          <TabsContent className="mt-4 space-y-3" value={selectedDay}>
            {activitiesContent}
          </TabsContent>
        </Tabs>
      )}

      <ActivityModal
        activity={editingActivity}
        category={modalCategory}
        dayNumber={editingActivity?.day_number ?? selectedDayNumber}
        destinationId={destinationId}
        isPending={isPending}
        onCancel={closeModal}
        onSave={handleModalSave}
        open={modalOpen}
      />
    </section>
  );
}
