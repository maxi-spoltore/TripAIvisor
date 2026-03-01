'use client';

import { CalendarIcon } from 'lucide-react';
import { enUS, es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
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

  return new Date(year, month - 1, day);
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
    <Popover
      align="start"
      className="w-[340px] max-w-[90vw]"
      disabled={disabled}
      onOpenChange={setOpen}
      open={open}
      trigger={
        <Button
          aria-expanded={open}
          aria-haspopup="dialog"
          className="min-w-[150px] justify-start gap-2 text-sm font-normal"
          disabled={disabled}
          id={id}
          size="sm"
          type="button"
          variant="outline"
        >
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          {displayValue ? <span>{displayValue}</span> : <span className="text-slate-400">{placeholder ?? ''}</span>}
        </Button>
      }
    >
      <Calendar
        defaultMonth={selectedDate}
        locale={dayPickerLocale}
        mode="single"
        onSelect={handleSelect}
        selected={selectedDate}
      />
    </Popover>
  );
}
