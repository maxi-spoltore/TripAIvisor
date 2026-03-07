'use client';

import { CalendarIcon } from 'lucide-react';
import { enUS, es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dates';

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  locale?: string;
  placeholder?: string;
  id?: string;
};

function toDate(dateStr: string): Date | undefined {
  if (!dateStr) {
    return undefined;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }

  return date;
}

function fromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DatePicker({ value, onChange, disabled = false, locale, placeholder, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const localeTag = locale?.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES';
  const dayPickerLocale = localeTag === 'en-US' ? enUS : es;
  const selectedDate = useMemo(() => toDate(value), [value]);
  const displayValue = value ? formatDate(value, localeTag) : null;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      return;
    }

    onChange(fromDate(date));
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            'h-11 max-w-full min-w-0 justify-start gap-2 rounded-md px-3 text-left text-body-sm font-medium',
            !displayValue && 'text-foreground-muted'
          )}
          disabled={disabled}
          id={id}
          size="sm"
          type="button"
          variant="outline"
        >
          <CalendarIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-route" />
          <span className="min-w-0 flex-1 truncate">{displayValue ?? placeholder ?? ''}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={16} className="w-[min(22rem,calc(100vw-2rem))] p-1">
        <Calendar
          defaultMonth={selectedDate}
          initialFocus
          locale={dayPickerLocale}
          mode="single"
          onSelect={handleSelect}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}
