'use client';

import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

type CalendarProps = DayPickerProps & {
  className?: string;
};

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-2',
        month: 'space-y-2',
        month_caption: 'flex items-center justify-between px-1',
        caption_label: 'text-sm font-medium text-slate-900',
        nav: 'flex items-center gap-1',
        button_previous:
          'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-transparent p-0 text-slate-600 hover:bg-slate-100',
        button_next:
          'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-transparent p-0 text-slate-600 hover:bg-slate-100',
        month_grid: 'w-full border-collapse table-fixed',
        weekdays: '',
        weekday: 'h-9 w-9 p-0 text-center align-middle text-xs font-medium text-slate-500',
        weeks: '',
        week: '',
        day: 'h-9 w-9 p-0 text-center align-middle text-sm',
        day_button:
          'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm hover:bg-primary-50 hover:text-primary-700',
        selected: 'bg-primary-600 text-white hover:bg-primary-700 hover:text-white',
        today: 'font-bold text-primary-600',
        outside: 'text-slate-300',
        disabled: 'cursor-not-allowed text-slate-300'
      }}
      showOutsideDays
      {...props}
    />
  );
}
