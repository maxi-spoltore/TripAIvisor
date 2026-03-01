# Date & UX Fixes + Stopovers

Five independent tasks. Each can be implemented and verified in isolation. Execute in order (later tasks build on earlier date infrastructure).

---

## Task 1: Date Off-By-One Fix

### Problem

`new Date("2024-05-01")` parses as UTC midnight. When `toLocaleDateString()` converts to local time, timezones behind UTC (e.g. Argentina UTC-3) see the previous day. A trip starting May 1 shows "30 abr" on destination cards.

All four date functions in `src/lib/utils/dates.ts` use `new Date(dateStr)` for YYYY-MM-DD strings and are affected.

### Changes

**File: `src/lib/utils/dates.ts`**

Add a private helper to parse YYYY-MM-DD strings as local timezone:

```typescript
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

Replace UTC-parsing `new Date(dateStr)` calls in all four functions:

**`calculateDate` (line 12):**
```diff
- const date = new Date(baseDate);
+ const date = parseLocalDate(baseDate);
  date.setDate(date.getDate() + daysToAdd);
- return date.toISOString().split('T')[0];
+ const y = date.getFullYear();
+ const m = String(date.getMonth() + 1).padStart(2, '0');
+ const d = String(date.getDate()).padStart(2, '0');
+ return `${y}-${m}-${d}`;
```

Note: `toISOString()` outputs UTC, which would be wrong once we parse as local. Manual formatting keeps everything in local timezone.

**`formatDate` (line 22):**
```diff
- const date = new Date(dateStr);
+ const date = parseLocalDate(dateStr);
```

**`validateEndDate` (lines 55-56):**
```diff
- const start = new Date(startDate);
- const end = new Date(newEndDate);
+ const start = parseLocalDate(startDate);
+ const end = parseLocalDate(newEndDate);
```

**File: `src/lib/utils/__tests__/dates.test.ts`**

Add timezone-specific regression test:

```typescript
it('formats May 1 correctly regardless of timezone', () => {
  const result = formatDate('2024-05-01', 'en-US');
  expect(result).toMatch(/may.*1/i);
});

it('calculates date without UTC drift', () => {
  expect(calculateDate('2024-05-01', 0)).toBe('2024-05-01');
});
```

### Acceptance Criteria

- [ ] Set trip start date to May 1. First destination card shows "1 may" (not "30 abr").
- [ ] `calculateDate('2024-05-01', 0)` returns `'2024-05-01'`.
- [ ] `formatDate('2024-05-01', 'es-ES')` contains "1" and "may".
- [ ] `validateEndDate('2024-05-01', '2024-05-10', 5)` returns `{ valid: true, difference: 4 }`.
- [ ] All existing tests in `src/lib/utils/__tests__/dates.test.ts` pass.

### Task 1 Implementation Summary (Completed)

**Scope implemented**

- Updated `src/lib/utils/dates.ts` to eliminate UTC parsing drift for `YYYY-MM-DD` values:
  - Added local parser helper `parseLocalDate(dateStr: string): Date`.
  - Switched `calculateDate` to local parsing and replaced `toISOString()` return formatting with manual local `YYYY-MM-DD` formatting.
  - Switched `formatDate` to local parsing.
  - Switched `validateEndDate` start/end parsing to local parsing.
- Updated `src/lib/utils/__tests__/dates.test.ts` with Task 1 regression coverage:
  - Added `formats May 1 correctly regardless of timezone`.
  - Added `calculates date without UTC drift`.

**Validation performed**

- `npm run build` executed successfully (compile + type checks + lint phase in Next build pipeline).
- Could not run `npx vitest run src/lib/utils/__tests__/dates.test.ts` in this repository because `vitest` is not configured as a project dependency and network is restricted in this environment (npm registry unreachable), so test execution could not be completed here.

**Task 1 outcome**

- Code changes required by Task 1 are implemented in the target utility and test files.
- Manual UI verification checklist items remain pending local runtime validation.

---

## Task 2: Custom Date Picker

### Problem

Native `<input type="date">` in `src/components/trips/trip-header.tsx` (lines 176-196) closes when navigating between months or years. Browser re-render behavior varies, but the result is a frustrating UX where users can't easily pick dates in different months.

### Approach

Install `react-day-picker` (~12KB, compatible with existing `date-fns` v4). Create three new UI components following the project's hand-rolled component pattern (no Radix/shadcn CLI).

### Changes

**Install dependency:**
```bash
npm install react-day-picker
```

**New file: `src/components/ui/popover.tsx`** — client component

Positioned overlay with click-outside-to-close. Follow the same hand-rolled pattern as `src/components/ui/dialog.tsx`.

```tsx
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
};

export function Popover({ open, onOpenChange, trigger, children, align = 'start', className }: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className="relative">
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
```

**New file: `src/components/ui/calendar.tsx`** — client component

Wraps `DayPicker` from react-day-picker with Tailwind styles matching the project's design system.

```tsx
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
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-2',
        caption: 'flex items-center justify-between px-1',
        caption_label: 'text-sm font-medium text-slate-900',
        nav: 'flex items-center gap-1',
        nav_button: 'h-7 w-7 rounded-md border border-slate-200 bg-transparent p-0 text-slate-600 hover:bg-slate-100 inline-flex items-center justify-center',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'w-9 text-center text-xs font-medium text-slate-500',
        row: 'flex w-full mt-1',
        cell: 'relative w-9 h-9 text-center text-sm',
        day: 'h-9 w-9 rounded-md text-sm hover:bg-primary-50 hover:text-primary-700 inline-flex items-center justify-center',
        day_selected: 'bg-primary-600 text-white hover:bg-primary-700 hover:text-white',
        day_today: 'font-bold text-primary-600',
        day_outside: 'text-slate-300',
        day_disabled: 'text-slate-300 cursor-not-allowed'
      }}
      {...props}
    />
  );
}
```

Note: The exact `classNames` keys depend on the react-day-picker version installed. After installing, verify the keys match the library's API (v9 uses different class name props than v8). Adjust accordingly.

**New file: `src/components/ui/date-picker.tsx`** — client component

Combines Popover + Calendar + formatted trigger button. **Only closes when a day is selected** (not on month/year navigation).

```tsx
'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { formatDate } from '@/lib/utils/dates';

type DatePickerProps = {
  value: string;          // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  disabled?: boolean;
  locale?: string;
  placeholder?: string;
  id?: string;
};

function toDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({ value, onChange, disabled, locale, placeholder, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const displayValue = value ? formatDate(value, localeTag) : null;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(fromDate(date));
      setOpen(false);  // Close ONLY when a day is selected
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          className="justify-start gap-2 text-sm font-normal"
          disabled={disabled}
          id={id}
          size="sm"
          type="button"
          variant="outline"
        >
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          {displayValue ?? <span className="text-slate-400">{placeholder ?? ''}</span>}
        </Button>
      }
    >
      <Calendar
        mode="single"
        selected={toDate(value)}
        onSelect={handleSelect}
        defaultMonth={toDate(value)}
      />
    </Popover>
  );
}
```

**File: `src/components/trips/trip-header.tsx` (lines 176-196)**

Replace both `<input type="date">` elements with `<DatePicker>`:

```diff
+ import { DatePicker } from '@/components/ui/date-picker';

  // Start date (lines 176-183):
- <input
-   className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
-   disabled={isPending}
-   id="trip-start-date"
-   onChange={(event) => handleStartDateChange(event.target.value)}
-   type="date"
-   value={localStartDate}
- />
+ <DatePicker
+   disabled={isPending}
+   id="trip-start-date"
+   locale={locale}
+   onChange={handleStartDateChange}
+   placeholder={tTrips('startDateLabel')}
+   value={localStartDate}
+ />

  // End date (lines 189-196):
- <input
-   className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
-   disabled={isPending}
-   id="trip-end-date"
-   onChange={(event) => handleEndDateChange(event.target.value)}
-   type="date"
-   value={localEndDate}
- />
+ <DatePicker
+   disabled={isPending}
+   id="trip-end-date"
+   locale={locale}
+   onChange={handleEndDateChange}
+   placeholder={tTrips('endDateLabel')}
+   value={localEndDate}
+ />
```

### Acceptance Criteria

- [ ] Open date picker, navigate forward/back months — picker stays open.
- [ ] Select a day — picker closes and date saves.
- [ ] Start and end date pickers both work independently.
- [ ] Date format in the trigger button matches locale (es-ES / en-US).
- [ ] Clicking outside the popover closes it.
- [ ] `npm run build` passes.

### Task 2 Implementation Summary (Completed)

**Scope implemented**

- Replaced native date inputs in `src/components/trips/trip-header.tsx` with `DatePicker` for both start and end date fields, preserving all existing save/validation handlers.
- Added `src/components/ui/popover.tsx`:
  - Controlled open state API (`open`, `onOpenChange`).
  - Click-outside close behavior.
  - Escape key close behavior.
  - Start/end alignment support and disabled trigger support.
- Added `src/components/ui/calendar.tsx`:
  - Wrapped `DayPicker` from `react-day-picker` (v9) with project-tailored Tailwind class mappings.
  - Preserved open-state behavior during month navigation (navigation does not close the popover).
  - Applied selected/today/outside/disabled day styles aligned with existing design tokens.
  - Enabled outside-day rendering for a stable month grid.
- Added `src/components/ui/date-picker.tsx`:
  - Composes `Popover` + `Calendar` + trigger `Button`.
  - Parses and formats `YYYY-MM-DD` using local date semantics.
  - Closes popover only when a valid day is selected.
  - Locale-aware trigger formatting via existing `formatDate` utility (`en-US` / `es-ES`) and locale-aware DayPicker rendering.

**Dependency note**

- `react-day-picker` is installed in project dependencies and used by `src/components/ui/calendar.tsx` as specified in Task 2.

**Validation performed**

- `npm run build` completed successfully after the Task 2 changes.
- Build output reported one pre-existing ESLint warning in `src/components/layout/user-menu.tsx` (`@next/next/no-img-element`), unrelated to Task 2.

**Task 2 outcome**

- Custom date picker infrastructure is implemented and wired into trip header start/end date controls.
- Month navigation now runs through `react-day-picker` inside the custom popover and no longer relies on browser-native date input behavior.

---

## Task 3: Auto-Shift End Date When Start Date Changes

### Problem

When a user changes the start date from May 1 to April 27, the end date stays at May 17, creating a misleading mismatch. The trip length (in days) should be preserved — shift the end date by the same delta as the start date change.

### Changes

**File: `src/lib/utils/dates.ts`**

Add `daysBetween` helper after `calculateDate`. Uses `parseLocalDate` added in Task 1.

```typescript
export function daysBetween(dateA: string, dateB: string): number {
  const a = parseLocalDate(dateA);
  const b = parseLocalDate(dateB);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
```

`Math.round` handles DST edge cases where the diff is 23 or 25 hours instead of exactly 24.

**File: `src/components/trips/trip-header.tsx`**

Update imports:

```diff
- import { validateEndDate } from '@/lib/utils/dates';
+ import { calculateDate, daysBetween, validateEndDate } from '@/lib/utils/dates';
```

Modify `handleStartDateChange` (lines 92-113) to auto-shift end date:

```diff
  const handleStartDateChange = (newStartDate: string) => {
    setLocalStartDate(newStartDate);

    if (!newStartDate) {
      setLocalEndDate('');
      setDateError(null);
      saveDates(null, null);
      return;
    }

-   if (localEndDate) {
-     const result = validateEndDate(newStartDate, localEndDate, totalDays);
-
-     if (!result.valid && result.error) {
-       setDateError(getDateErrorMessage(result.error));
-       return;
-     }
-   }
-
-   setDateError(null);
-   saveDates(newStartDate, localEndDate || null);
+   if (localEndDate && localStartDate) {
+     const delta = daysBetween(localStartDate, newStartDate);
+     const shiftedEndDate = calculateDate(localEndDate, delta);
+
+     if (shiftedEndDate) {
+       const result = validateEndDate(newStartDate, shiftedEndDate, totalDays);
+       if (!result.valid && result.error) {
+         setDateError(getDateErrorMessage(result.error));
+         return;
+       }
+       setLocalEndDate(shiftedEndDate);
+       setDateError(null);
+       saveDates(newStartDate, shiftedEndDate);
+       return;
+     }
+   }
+
+   setDateError(null);
+   saveDates(newStartDate, localEndDate || null);
  };
```

**File: `src/lib/utils/__tests__/dates.test.ts`**

Add tests for `daysBetween`:

```typescript
import { daysBetween } from '../dates';

describe('daysBetween', () => {
  it('returns positive difference when B is after A', () => {
    expect(daysBetween('2024-01-15', '2024-01-20')).toBe(5);
  });

  it('returns negative difference when B is before A', () => {
    expect(daysBetween('2024-01-20', '2024-01-15')).toBe(-5);
  });

  it('returns 0 for the same date', () => {
    expect(daysBetween('2024-01-15', '2024-01-15')).toBe(0);
  });

  it('works across months', () => {
    expect(daysBetween('2024-01-28', '2024-02-04')).toBe(7);
  });
});
```

### Acceptance Criteria

- [ ] Start May 1, End May 17 (16-day trip). Change start to April 27. End auto-shifts to May 13 (still 16 days).
- [ ] Start May 1, End May 17. Change start to May 5. End auto-shifts to May 21.
- [ ] If no end date is set, changing start date saves normally with no end date.
- [ ] If start date is cleared, end date is also cleared.
- [ ] `daysBetween` tests pass.

### Task 3 Implementation Summary (Completed)

**Scope implemented**

- Updated `src/lib/utils/dates.ts`:
  - Added `daysBetween(dateA, dateB)` using local date parsing and `Math.round` day-difference calculation to preserve correctness across DST boundary hour shifts.
- Updated `src/components/trips/trip-header.tsx` start-date flow:
  - Added imports for `calculateDate` and `daysBetween`.
  - Updated `handleStartDateChange` to preserve trip duration by:
    - computing start-date delta from previous start date to new start date,
    - shifting existing end date by the same delta,
    - validating shifted end date against `validateEndDate`,
    - saving shifted end date when valid.
  - Preserved existing edge-case behavior:
    - clearing start date clears end date and persists `null` dates,
    - when no end date exists, start date saves without forcing an end date.
- Updated `src/lib/utils/__tests__/dates.test.ts`:
  - Added `daysBetween` coverage for positive, negative, zero, and cross-month differences.

**Validation performed**

- `npm run build` completed successfully after Task 3 changes.
- Build output still reports one pre-existing ESLint warning in `src/components/layout/user-menu.tsx` (`@next/next/no-img-element`), unrelated to Task 3.
- `vitest` execution is still not available in this repository setup (`vitest` is not present in project dependencies/scripts), so the newly added unit tests were added but could not be executed in this environment.

**Task 3 outcome**

- End date now auto-shifts when start date changes, preserving trip length instead of leaving dates mismatched.
- Date utility support (`daysBetween`) and test coverage for the new helper are in place.

---

## Task 4: Stopovers & Departure Card

### Problem

Four sub-issues:
1. No departure card in the timeline — `src/components/trips/departure-card.tsx` is a placeholder.
2. No way to represent transit cities (e.g. Madrid as a brief stopover between Buenos Aires and Valencia).
3. No `arrival_time` or `travel_days` fields on transport to handle long-haul date shifts.
4. Departure transport has no edit UI despite data model support (`TransportRole` already includes `'departure'`, `getTripById` already fetches `departure_transport`).

### Sub-task 4a: Schema Migration + Types

**New file: `supabase/migrations/202602280002_add_stopovers.sql`**

```sql
-- Add stopover flag to destinations
ALTER TABLE destinations ADD COLUMN is_stopover boolean NOT NULL DEFAULT false;

-- Relax duration constraint for stopovers (allow 0 when is_stopover = true)
-- The existing inline check is: check (duration >= 1)
-- Postgres auto-names it as "destinations_duration_check"
ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_duration_check;
ALTER TABLE destinations ADD CONSTRAINT destinations_duration_check
  CHECK ((is_stopover = true AND duration >= 0) OR (is_stopover = false AND duration >= 1));

-- Add arrival_time and travel_days to transports
ALTER TABLE transports ADD COLUMN arrival_time time;
ALTER TABLE transports ADD COLUMN travel_days integer NOT NULL DEFAULT 0;
```

Note: If the auto-generated constraint name differs, run this query to find it:
```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'destinations'::regclass AND contype = 'c';
```

**File: `src/types/database.ts`**

```diff
  export interface Destination {
    destination_id: number;
    trip_id: number;
    city: string;
    duration: number;
    position: number;
+   is_stopover: boolean;
    notes: string | null;
    budget: number | null;
    created_at: string;
    updated_at: string;
  }

  export interface Transport {
    transport_id: number;
    destination_id: number | null;
    trip_id: number | null;
    transport_role: TransportRole;
    transport_type: TransportType;
    leave_accommodation_time: string | null;
    terminal: string | null;
    company: string | null;
    booking_number: string | null;
    booking_code: string | null;
    departure_time: string | null;
+   arrival_time: string | null;
+   travel_days: number;
    created_at: string;
    updated_at: string;
  }
```

### Sub-task 4b: Departure Card + Modal

**Rewrite file: `src/components/trips/departure-card.tsx`** — client component

Follow the structure of `src/components/trips/return-card.tsx` (lines 1-226).

Props:
```typescript
type DepartureCardProps = {
  locale: string;
  tripId: number;
  departureCity: string;
  startDate: string | null;
  departureTransport: Transport | null;
};
```

Display structure:
- Card container: `rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50/60 to-white shadow-sm` (same as ReturnCard line 173)
- Title: `{tTrips('departureFrom', { city: departureCity })}` — e.g. "Departure from Buenos Aires"
- Date: formatted `startDate` below title (or "No date set" fallback)
- Edit button: opens `DepartureTransportModal`
- Transport details section: reuse the same `getTransportDetails` / `getTransportIconByType` / `hasTransportContent` pattern from `return-card.tsx` (lines 25-128)
- **New fields display:**
  - `arrival_time`: add to details array as `{ label: 'Arrival time' / 'Hora de llegada', value: transport.arrival_time }`
  - `travel_days`: if > 0, show badge below transport details: `<span className="...">{tTrips('travelDaysBadge', { count: transport.travel_days })}</span>`

Server action call: `updateDepartureTransportAction` (mirrors existing `updateReturnTransportAction` pattern, return-card.tsx lines 148-169).

**New file: `src/components/trips/departure-transport-modal.tsx`** — client component

Mirror `src/components/trips/return-transport-modal.tsx` exactly (lines 1-279), with these additions:

Export type:
```typescript
export type DepartureTransportSubmitInput = {
  transport_type: TransportType;
  leave_accommodation_time: string | null;
  terminal: string | null;
  company: string | null;
  booking_number: string | null;
  booking_code: string | null;
  departure_time: string | null;
  arrival_time: string | null;    // NEW
  travel_days: number;             // NEW
};
```

Form state type:
```typescript
type DepartureTransportFormState = {
  transport_type: TransportType;
  leave_accommodation_time: string;
  terminal: string;
  company: string;
  booking_number: string;
  booking_code: string;
  departure_time: string;
  arrival_time: string;       // NEW — <Input type="time">
  travel_days: string;        // NEW — <Input type="number" min={0}>
};
```

Add two fields in the form grid (after `departure_time`, line 243-256 in the return modal):
- Arrival time: `<Input type="time">` — label: `tTransport('arrivalTime')`
- Travel days: `<Input type="number" min={0}>` — label: `tTransport('travelDays')`

Dialog title: `tTrips('editDeparture')`.

`getInitialState` populates new fields: `arrival_time: toInputValue(transport?.arrival_time ?? null)`, `travel_days: String(transport?.travel_days ?? 0)`.

Submit handler normalizes: `arrival_time: toNullable(formState.arrival_time)`, `travel_days: Number(formState.travel_days) || 0`.

**File: `src/app/actions/trips.ts`**

Add `updateDepartureTransportAction` after `updateReturnTransportAction` (line 250). Mirror the exact same structure:

```typescript
export async function updateDepartureTransportAction(input: {
  locale: string;
  tripId: number;
  transport: {
    transport_type: TransportType;
    leave_accommodation_time: string | null;
    terminal: string | null;
    company: string | null;
    booking_number: string | null;
    booking_code: string | null;
    departure_time: string | null;
    arrival_time: string | null;
    travel_days: number;
  };
}): Promise<Transport> {
  const { locale, tripId, transport } = input;
  await requireUserId(locale);

  if (!Number.isFinite(tripId)) {
    throw new Error('Invalid trip id.');
  }

  const result = await upsertTransport({
    trip_id: tripId,
    transport_role: 'departure',
    ...transport
  });

  revalidatePath(`/${locale}/trips/${tripId}`);
  return result;
}
```

**Wire DepartureCard into the timeline:**

**File: `src/app/[locale]/trips/[tripId]/page.tsx`**

Pass departure data and travelDays to DestinationList:

```diff
+ const travelDays = trip.departure_transport?.travel_days ?? 0;
  const totalDays = trip.destinations.reduce((acc, destination) => acc + destination.duration, 0);
- const returnDate = calculateDate(trip.start_date, totalDays);
+ const returnDate = calculateDate(trip.start_date, travelDays + totalDays);

  <DestinationList
    destinations={trip.destinations}
+   departureCity={trip.departure_city}
+   departureTransport={trip.departure_transport}
    locale={locale}
    returnCity={trip.return_city ?? trip.departure_city}
    returnDate={returnDate}
    returnTransport={trip.return_transport}
    startDate={trip.start_date}
+   travelDays={travelDays}
    tripId={trip.trip_id}
  />
```

**File: `src/components/trips/destination-list.tsx`**

Add props:

```diff
+ import { PlaneTakeoff } from 'lucide-react';
+ import { DepartureCard } from './departure-card';

  type DestinationListProps = {
    locale: string;
    tripId: number;
    destinations: DestinationWithRelations[];
    startDate: string | null;
+   departureCity?: string;
+   departureTransport?: Transport | null;
+   travelDays?: number;
    returnCity?: string;
    returnDate?: string | null;
    returnTransport?: Transport | null;
  };
```

Inside the timeline `<div className="relative space-y-0">` (line 349), before `{items.map(...)}` (line 351), add:

```tsx
{departureCity ? (
  <div className="relative flex gap-4 pb-4">
    <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
      <PlaneTakeoff className="h-4 w-4" />
    </div>
    <div className="flex-1">
      <DepartureCard
        departureCity={departureCity}
        departureTransport={departureTransport ?? null}
        locale={locale}
        startDate={startDate}
        tripId={tripId}
      />
    </div>
  </div>
) : null}
```

### Sub-task 4c: Transit City Stopovers

**Stopover in add-destination form:**

**File: `src/components/trips/destination-list.tsx`**

Add state:
```typescript
const [isStopover, setIsStopover] = useState(false);
```

In `addDestinationForm` function (line 278), add a checkbox row before the city input (inside the dashed form container div, line 286):

```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id={atPosition !== undefined ? `stopover-${atPosition}` : 'stopover-bottom'}
    checked={isStopover}
    onChange={(event) => {
      setIsStopover(event.target.checked);
      if (event.target.checked) setNewDuration('0');
      else setNewDuration('2');
    }}
    disabled={isPending}
    className="h-4 w-4 rounded border-slate-300 text-primary-600"
  />
  <label
    htmlFor={atPosition !== undefined ? `stopover-${atPosition}` : 'stopover-bottom'}
    className="text-xs font-medium text-slate-500"
  >
    {locale === 'es' ? 'Escala' : 'Stopover'}
  </label>
</div>
```

When `isStopover` is checked, hide the duration column (the `<div className="flex flex-1 flex-col gap-1">` around the duration input, line 301):

```tsx
{!isStopover ? (
  <div className="flex flex-1 flex-col gap-1">
    <label className="text-xs font-medium text-slate-500">{tDestinations('duration')}</label>
    <Input ... />
  </div>
) : null}
```

Pass `isStopover` to `createDestinationAction` in `handleAddDestination` (line 150):

```diff
  const createdDestination = await createDestinationAction({
    locale,
    tripId,
    city: trimmedCity,
    duration,
    position: atPosition,
+   isStopover
  });
```

After successful creation, reset: `setIsStopover(false);`

Stopover timeline node — in the `items.map()` at line 377-380, conditionally render a different circle:

```tsx
{destination.is_stopover ? (
  <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-300 bg-amber-50 text-amber-600">
    <ArrowRightLeft className="h-4 w-4" />
  </div>
) : (
  <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-300 bg-white text-sm font-bold text-primary-700">
    {index + 1}
  </div>
)}
```

Import `ArrowRightLeft` from `lucide-react`.

Pass `travelDays` to each `DestinationCard`:

```diff
  <DestinationCard
    destination={destination}
    destinations={items}
    ...
    startDate={startDate}
+   travelDays={travelDays ?? 0}
  />
```

**File: `src/app/actions/destinations.ts`**

Extend `createDestinationAction` input (line 121):

```diff
  export async function createDestinationAction(input: {
    locale: string;
    tripId: number;
    city: string;
    duration: number;
    position?: number;
+   isStopover?: boolean;
  }): Promise<Destination> {
-   const { locale, tripId, city, duration, position } = input;
+   const { locale, tripId, city, duration, position, isStopover } = input;
    // ... existing validation ...
-   const destination = await createDestination(tripId, city, duration, position);
+   const destination = await createDestination(tripId, city, duration, position, isStopover);
    // ...
  }
```

Relax duration validation in `saveDestinationDetailsAction` (line 207):

```diff
- if (!Number.isFinite(duration) || duration < 1) {
-   throw new Error('Duration must be at least 1.');
+ if (!Number.isFinite(duration) || duration < 0) {
+   throw new Error('Duration must be at least 0.');
  }
```

**File: `src/lib/db/queries/destinations.ts`**

Update `createDestination` to accept and pass `is_stopover`:

```diff
  export async function createDestination(
    tripId: number,
    city: string,
    duration: number,
-   position?: number
+   position?: number,
+   isStopover?: boolean
  ): Promise<Destination> {
    // ... existing position logic ...
    const { data, error } = await supabase
      .from('destinations')
      .insert({
        trip_id: tripId,
        city,
        duration,
-       position: resolvedPosition
+       position: resolvedPosition,
+       is_stopover: isStopover ?? false
      })
      .select()
      .single();
    // ...
  }
```

**Stopover card variant:**

**File: `src/components/trips/destination-card.tsx`**

Add stopover awareness. At line 234, change card container class:

```diff
- <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
+ <div className={cn(
+   'rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md',
+   destination.is_stopover
+     ? 'border-dashed border-slate-300 bg-slate-50'
+     : 'border-slate-200 bg-white'
+ )}>
```

Import `cn` from `@/lib/utils` (already imported in destination-list.tsx; add to this file's imports).

Replace the days badge at line 245-247:

```diff
- <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
-   {destination.duration} {locale === 'es' ? 'días' : 'days'}
- </span>
+ <span className={cn(
+   'rounded-full px-2.5 py-0.5 text-xs font-medium',
+   destination.is_stopover
+     ? 'bg-amber-100 text-amber-700'
+     : 'bg-slate-100 text-slate-600'
+ )}>
+   {destination.is_stopover
+     ? (locale === 'es' ? 'Escala' : 'Stopover')
+     : `${destination.duration} ${locale === 'es' ? 'días' : 'days'}`}
+ </span>
```

Hide accommodation sections for stopovers. In the collapsed preview (line 316):

```diff
- {accommodationPreview.length > 0 ? (
+ {accommodationPreview.length > 0 && !destination.is_stopover ? (
```

In the expanded view (line 363):

```diff
- {accommodationDetails.length > 0 ? (
+ {accommodationDetails.length > 0 && !destination.is_stopover ? (
```

Add `travelDays` prop:

```diff
  type DestinationCardProps = {
    destination: DestinationWithRelations;
    destinations: DestinationWithRelations[];
    index: number;
    locale: string;
    startDate: string | null;
+   travelDays?: number;
    expanded: boolean;
    // ...
  };
```

At line 212, pass `travelDays`:

```diff
- const { start, end } = getDestinationDates(startDate, destinations, index);
+ const { start, end } = getDestinationDates(startDate, destinations, index, travelDays);
```

**Stopover toggle in edit modal:**

**File: `src/components/trips/destination-modal.tsx`**

Add `is_stopover` to form state (line 48-70):

```diff
  type DestinationModalFormState = {
    city: string;
    duration: string;
+   isStopover: boolean;
    notes: string;
    // ...
  };
```

Add `isStopover` to `DestinationModalSubmitInput` (line 23-46):

```diff
  export type DestinationModalSubmitInput = {
    destinationId: number;
    city: string;
    duration: number;
+   isStopover: boolean;
    notes: string | null;
    // ...
  };
```

Initialize from destination (in the `useEffect` at line 162-196):

```diff
  setFormState({
    city: destination.city,
    duration: String(destination.duration),
+   isStopover: destination.is_stopover,
    notes: destination.notes ?? '',
    // ...
  });
```

Add stopover toggle before city input (line 341):

```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={formState.isStopover}
    onChange={(event) => {
      const checked = event.target.checked;
      setFormState((prev) => prev ? {
        ...prev,
        isStopover: checked,
        duration: checked ? '0' : (prev.duration === '0' ? '2' : prev.duration)
      } : prev);
    }}
    disabled={isPending}
    className="h-4 w-4 rounded border-slate-300 text-primary-600"
  />
  <Label>{locale === 'es' ? 'Escala' : 'Stopover'}</Label>
</div>
```

When `isStopover` is true, hide or disable the duration input (line 360-378).

Update duration validation in `handleSubmit` (line 268):

```diff
- if (!Number.isFinite(duration) || duration < 1) {
+ if (!Number.isFinite(duration) || (!formState.isStopover && duration < 1)) {
```

Include in submit payload:

```diff
  void onSave({
    destinationId: destination.destination_id,
    city,
    duration: Math.trunc(duration),
+   isStopover: formState.isStopover,
    notes: toNullable(formState.notes),
    // ...
  });
```

**File: `src/app/actions/destinations.ts`**

In `saveDestinationDetailsAction` (line 196), accept and persist `isStopover`:

```diff
  type DestinationDetailsInput = {
    // ...
+   isStopover: boolean;
  };

  // In the function body, pass is_stopover to updateDestination:
  const updatedDestination = await updateDestination(
    destinationId,
    {
      city,
      duration,
+     is_stopover: isStopover,
      notes,
      budget
    },
    tripId
  );
```

### Sub-task 4d: Travel Days Offset in Date Calculations

**File: `src/lib/utils/dates.ts`**

Add `travelDays` parameter to `getDestinationDates` (line 30):

```diff
  export function getDestinationDates(
    startDate: string | null,
    destinations: DestinationDuration[],
-   index: number
+   index: number,
+   travelDays: number = 0
  ): { start: string | null; end: string | null } {
    if (!startDate) {
      return { start: null, end: null };
    }

-   let dayOffset = 0;
+   let dayOffset = travelDays;
    for (let i = 0; i < index; i += 1) {
      dayOffset += destinations[i].duration || 0;
    }
```

Default value `0` ensures backward compatibility — all existing callers work unchanged.

**File: `src/lib/utils/__tests__/dates.test.ts`**

Add tests:

```typescript
it('offsets destination dates by travel days', () => {
  const destinations = [{ duration: 3 }, { duration: 5 }];
  const result = getDestinationDates('2024-01-15', destinations, 0, 2);
  expect(result.start).toBe('2024-01-17');
  expect(result.end).toBe('2024-01-20');
});

it('handles 0-duration stopover without advancing offset', () => {
  const destinations = [{ duration: 0 }, { duration: 5 }];
  const result = getDestinationDates('2024-01-15', destinations, 1);
  expect(result.start).toBe('2024-01-15');
  expect(result.end).toBe('2024-01-20');
});
```

### Translation Keys

**en.json** — add to `"trips"`:
```json
"departureFrom": "Departure from {city}",
"editDeparture": "Edit departure details",
"travelDaysBadge": "{count} travel days"
```

**es.json** — add to `"trips"`:
```json
"departureFrom": "Salida desde {city}",
"editDeparture": "Editar detalles de salida",
"travelDaysBadge": "{count} días de viaje"
```

**en.json** — add to `"transport"`:
```json
"arrivalTime": "Arrival time",
"travelDays": "Travel days"
```

**es.json** — add to `"transport"`:
```json
"arrivalTime": "Hora de llegada",
"travelDays": "Días de viaje"
```

**en.json** — add to `"destinations"`:
```json
"stopover": "Stopover"
```

**es.json** — add to `"destinations"`:
```json
"stopover": "Escala"
```

### Acceptance Criteria

- [ ] **DepartureCard:** Appears at top of timeline with PlaneTakeoff icon, city name, and start date.
- [ ] **DepartureCard edit:** Click edit → modal opens with all transport fields + arrival_time + travel_days. Save persists and updates card.
- [ ] **Stopover create:** Check "Stopover" in add-destination form → duration hidden, defaults to 0. City is created as stopover.
- [ ] **Stopover display:** Stopover card has dashed border, amber "Stopover"/"Escala" badge, no accommodation section, route icon in timeline (not a number).
- [ ] **Stopover edit:** Edit modal shows stopover toggle. Can toggle between stopover and regular destination.
- [ ] **Travel days:** Set travel_days=2 on departure transport. First destination starts 2 days after trip start date.
- [ ] **Return date:** Return date = trip start + travelDays + totalDestinationDays.
- [ ] **0-duration:** Stopover with 0 days doesn't advance date offset — next destination starts on the same date.
- [ ] All existing tests pass. New `getDestinationDates` tests pass.
- [ ] `npm run build` and `npm run lint` pass.

### Task 4 Implementation Summary (Completed)

**Scope implemented**

- Added migration `supabase/migrations/202602280002_add_stopovers.sql`:
  - Added `destinations.is_stopover` (`boolean`, default `false`).
  - Replaced duration check constraint to allow `duration >= 0` only when `is_stopover = true`.
  - Added `transports.arrival_time` (`time`) and `transports.travel_days` (`integer`, default `0`).
- Extended data model in `src/types/database.ts`:
  - `Destination` now includes `is_stopover`.
  - `Transport` now includes `arrival_time` and `travel_days`.
- Updated destination query/action persistence:
  - `createDestination`/`createDestinationAction` now accept and persist `isStopover` into `is_stopover`.
  - `saveDestinationDetailsAction` now accepts `isStopover`, persists `is_stopover`, and allows zero-day durations.
  - Destination query normalization now supports stopover-compatible duration values.
- Added departure transport editing backend:
  - Added `updateDepartureTransportAction` in `src/app/actions/trips.ts`.
  - Extended `upsertTransport` in `src/lib/db/queries/transports.ts` to persist `arrival_time` and `travel_days`.
- Implemented departure transport UI:
  - Added `src/components/trips/departure-transport-modal.tsx` with all transport fields plus `arrival_time` and `travel_days`.
  - Replaced placeholder `src/components/trips/departure-card.tsx` with full card + edit flow, transport details rendering, and travel-days badge.
- Wired departure card and travel-day offsets into timeline:
  - `src/app/[locale]/trips/[tripId]/page.tsx` now computes `travelDays` from departure transport.
  - Return date now uses `trip start + travelDays + totalDestinationDays`.
  - `DestinationList` now renders a top departure node/card and passes `travelDays` into each `DestinationCard`.
- Implemented stopover UX in destination list/cards/modals:
  - Add-destination form now includes a stopover toggle, hides duration when enabled, defaults to `0`, and persists as stopover.
  - Timeline node shows a stopover icon/style for stopover rows.
  - `DestinationCard` now supports stopover visual variant (dashed card, amber badge, stopover label) and hides accommodation sections for stopovers.
  - `DestinationModal` now includes stopover toggle, stopover-aware duration behavior, and submits `isStopover`.
- Updated date utility for travel-day offsets:
  - `getDestinationDates` now accepts optional `travelDays` offset (default `0`).
  - Added tests for travel-day offset behavior and 0-duration stopover behavior in `src/lib/utils/__tests__/dates.test.ts`.
- Added i18n keys in `src/messages/en.json` and `src/messages/es.json`:
  - `trips`: `editDeparture`, `travelDaysBadge`.
  - `transport`: `arrivalTime`, `travelDays`.
  - `destinations`: `stopover`.

**Validation performed**

- `npm run build` passes after Task 4 changes (one pre-existing lint warning remains in `src/components/layout/user-menu.tsx` for `@next/next/no-img-element`, unrelated to Task 4).
- `npm run lint` passes with the same pre-existing warning.
- `npx vitest run src/lib/utils/__tests__/dates.test.ts` could not run in this environment because `vitest` is not installed as a local dependency and restricted network prevents downloading it from npm.

**Task 4 outcome**

- Task 4a/4b/4c/4d code paths are implemented and wired through schema, types, actions, UI, i18n, and date calculation behavior.
- Manual runtime verification of all UI acceptance criteria remains pending local interaction testing.

---

## Files Summary

### New Files

| File | Type | Task |
|------|------|------|
| `src/components/ui/popover.tsx` | Client | 2 |
| `src/components/ui/calendar.tsx` | Client | 2 |
| `src/components/ui/date-picker.tsx` | Client | 2 |
| `src/components/trips/departure-transport-modal.tsx` | Client | 4b |
| `supabase/migrations/202602280002_add_stopovers.sql` | SQL | 4a |

### Modified Files

| File | Tasks |
|------|-------|
| `src/lib/utils/dates.ts` | 1, 3, 4d |
| `src/lib/utils/__tests__/dates.test.ts` | 1, 3, 4d |
| `src/components/trips/trip-header.tsx` | 2, 3 |
| `src/components/trips/departure-card.tsx` | 4b (rewrite from placeholder) |
| `src/components/trips/destination-card.tsx` | 4c, 4d |
| `src/components/trips/destination-list.tsx` | 4b, 4c, 4d |
| `src/components/trips/destination-modal.tsx` | 4c |
| `src/app/[locale]/trips/[tripId]/page.tsx` | 4b, 4d |
| `src/app/actions/trips.ts` | 4b |
| `src/app/actions/destinations.ts` | 4c |
| `src/lib/db/queries/destinations.ts` | 4c |
| `src/types/database.ts` | 4a |
| `src/messages/en.json` | 4 |
| `src/messages/es.json` | 4 |
| `package.json` | 2 |

### Reused Functions/Utilities

| Function | File | Used in |
|----------|------|---------|
| `formatDate` | `src/lib/utils/dates.ts` | 2 (DatePicker trigger), 4b (DepartureCard date) |
| `calculateDate` | `src/lib/utils/dates.ts` | 3 (shift end date), 4d (return date) |
| `validateEndDate` | `src/lib/utils/dates.ts` | 3 (validate shifted end date) |
| `getDestinationDates` | `src/lib/utils/dates.ts` | 4d (add travelDays param) |
| `upsertTransport` | `src/lib/db/queries/transports.ts` | 4b (departure action) |
| `updateDestination` | `src/lib/db/queries/destinations.ts` | 4c (persist is_stopover) |
| `ReturnTransportModal` pattern | `src/components/trips/return-transport-modal.tsx` | 4b (DepartureTransportModal mirror) |
| `ReturnCard` pattern | `src/components/trips/return-card.tsx` | 4b (DepartureCard structure) |

---

## Verification

1. Run DB migration: `supabase/migrations/202602280002_add_stopovers.sql`
2. Run dev server: `npm run dev`
3. Run tests: `npx vitest run src/lib/utils/__tests__/dates.test.ts`
4. Test each task per its acceptance criteria
5. Test both locales (ES and EN) for all new UI strings
6. `npm run build` and `npm run lint` pass after all tasks
