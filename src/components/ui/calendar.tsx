'use client';

import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

type CalendarProps = DayPickerProps & {
  className?: string;
};

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3 sm:p-4', className)}
      classNames={{
        months: 'flex flex-col gap-3',
        month: 'space-y-3',
        month_caption: 'flex items-center justify-between px-1',
        caption_label: 'text-label-md font-semibold text-foreground-primary',
        nav: 'flex items-center gap-1',
        button_previous:
          'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface p-0 text-foreground-secondary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        button_next:
          'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface p-0 text-foreground-secondary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        month_grid: 'w-full border-collapse table-fixed',
        weekdays: '',
        weekday: 'h-9 w-10 p-0 text-center align-middle text-label-sm text-foreground-muted',
        weeks: '',
        week: '',
        day: 'h-10 w-10 p-0 text-center align-middle text-body-sm aria-selected:bg-transparent',
        day_button:
          'inline-flex h-10 w-10 items-center justify-center rounded-md text-body-sm text-foreground-primary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas aria-selected:bg-brand-primary aria-selected:text-white aria-selected:hover:bg-brand-primary-hover aria-selected:hover:text-white',
        selected: '',
        today: 'font-semibold text-brand-primary',
        outside: 'text-foreground-muted/50',
        disabled: 'cursor-not-allowed text-foreground-muted/50 opacity-60'
      }}
      showOutsideDays
      {...props}
    />
  );
}
