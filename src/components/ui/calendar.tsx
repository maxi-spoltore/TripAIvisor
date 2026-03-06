'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 sm:p-4', className)}
      classNames={{
        months: 'flex flex-col gap-3',
        month: 'space-y-3',
        month_caption: 'flex items-center justify-between px-1',
        caption_label: 'text-label-md font-semibold text-foreground-primary',
        nav: 'flex items-center gap-1',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface p-0 text-foreground-secondary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface p-0 text-foreground-secondary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        chevron: 'size-4',
        month_grid: 'w-full border-collapse table-fixed',
        weekdays: '',
        weekday: 'h-9 w-10 p-0 text-center align-middle text-label-sm text-foreground-muted',
        weeks: '',
        week: '',
        day: 'h-10 w-10 p-0 text-center align-middle text-body-sm text-foreground-primary aria-selected:rounded-md aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:font-semibold',
        day_button:
          'inline-flex h-10 w-10 items-center justify-center rounded-md text-body-sm transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        today: 'font-semibold text-brand-primary',
        outside: 'text-foreground-muted/50 aria-selected:bg-primary/20 aria-selected:text-foreground-muted/80',
        disabled: 'cursor-not-allowed text-foreground-muted/50 opacity-60',
        hidden: 'invisible',
        ...classNames
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) =>
          orientation === 'left' ? (
            <ChevronLeft aria-hidden="true" className={cn('size-4', chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRight aria-hidden="true" className={cn('size-4', chevronClassName)} {...chevronProps} />
          ),
        ...components
      }}
      {...props}
    />
  );
}
