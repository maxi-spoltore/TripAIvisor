# TripAIvisor — 11 Requirements Implementation Plan

## Context

The TripAIvisor app has several UX gaps: the header logo isn't clickable, trip dates/cities are non-editable, there's no way to log out, the trip list lives on the home page, destination action menus are clipped, and the timeline lacks insert-at-position and return-card features. This plan addresses all 11 requirements.

---

## Task 1: Fix action menu overflow (Req #10)

### Problem
The destination card's outer `<div>` at `destination-card.tsx:234` has `overflow-hidden`, which clips the absolute-positioned dropdown menu when the card has minimal content (only city name, no transport/accommodation details). The Delete button is hidden.

### Changes
**File: `src/components/trips/destination-card.tsx`**
- Line 234: remove `overflow-hidden` from the class string.

```diff
- <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
+ <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
```

This is safe because unlike `trip-header.tsx` (which uses `overflow-hidden` to clip its gradient top bar), `destination-card.tsx` has no content that needs clipping — its rounded corners are preserved by `rounded-xl` on child elements.

### Acceptance Criteria
- [x] Add a new destination with only a city name (no other data). Click the 3-dot menu. Both "Edit" and "Delete" options are fully visible.
- [x] Existing cards with content still display correctly (no visual regression).

### Task 1 Implementation Summary (Completed)

- Updated `src/components/trips/destination-card.tsx` to remove `overflow-hidden` from the outer card container class list:
  - from `overflow-hidden rounded-xl border ...`
  - to `rounded-xl border ...`
- Kept all other card structure and styles unchanged, including:
  - dropdown menu positioning (`absolute right-0 top-full`) and z-index (`z-10`)
  - card border, radius, hover shadow, and internal spacing
- Result:
  - action menu is no longer clipped by the card container when content is minimal
  - existing destination card layout remains intact because rounded corners are still handled by `rounded-xl`
- Verification completed:
  - `npm run lint` passed (1 pre-existing warning in `src/components/layout/header.tsx` about `<img>`)
  - `npm run build` passed successfully

---

## Task 2: Route restructure — move trip list to /trips + landing page (Req #4)

### Problem
The trip list currently lives at `/{locale}/` (home page). It should be at `/{locale}/trips`. The home page should become a welcome dashboard with quick stats.

### Changes

**New file: `src/app/[locale]/trips/page.tsx`**
- Copy the trip list logic from `src/app/[locale]/page.tsx` wholesale: auth check, `getUserTrips`, `getTripDestinationStats`, TripCard grid, empty state, ImportTripButton, CreateTripButton.
- The component function should be named `TripsListPage`.
- Same imports, same props type `{ params: { locale: string } }`.

**Modify: `src/app/[locale]/page.tsx`**
- Replace the trip list with a welcome landing page. Structure:

```tsx
// Auth check (same pattern as current)
const session = ...; const userId = ...; if (!userId) redirect(`/${locale}/login`);

// Fetch stats
const trips = await getUserTrips(userId);
const tripStats = await getTripDestinationStats(trips.map(t => t.trip_id));
const totalDestinations = Object.values(tripStats).reduce((sum, s) => sum + s.destinationCount, 0);

// Render
<main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 p-8">
  {/* User greeting */}
  <div className="text-center">
    <h1 className="text-3xl font-semibold">{tTrips('welcome', { name: session.user.name ?? '' })}</h1>
    <p className="mt-2 text-slate-500">{tAuth('tagline')}</p>
  </div>

  {/* Quick stats — row of 2 cards */}
  <div className="grid gap-4 sm:grid-cols-2 w-full max-w-md">
    <Card>
      <CardContent className="flex flex-col items-center p-6">
        <span className="text-3xl font-bold text-primary-600">{trips.length}</span>
        <span className="text-sm text-slate-500">{tTrips('totalTrips', { count: trips.length })}</span>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="flex flex-col items-center p-6">
        <span className="text-3xl font-bold text-primary-600">{totalDestinations}</span>
        <span className="text-sm text-slate-500">{tTrips('totalDestinations', { count: totalDestinations })}</span>
      </CardContent>
    </Card>
  </div>

  {/* CTA */}
  <Link href={`/${locale}/trips`} className="...button styles...">
    {tTrips('goToTrips')}
  </Link>
</main>
```

- Import `Card`, `CardContent` from `@/components/ui/card`, `Link` from `next/link`.
- The layout needs the session user `name`. Currently `page.tsx` only gets user id from session. Extend the `SessionUser` type to include `name`:
  ```tsx
  type SessionUser = { user?: { id?: number | string; user_id?: number | string; name?: string | null } };
  ```

**Modify: `src/app/actions/trips.ts`**
- In every `revalidatePath` call that includes `/${locale}`, also add `revalidatePath(`/${locale}/trips`)`.
- Affected functions: `createTripForLocaleAction` (line 120), `deleteTripForLocaleAction` (line 139), `updateTripTitleAction` (lines 155-156), `importTripFromDataAction` (line 268).

**Modify: `src/app/actions/destinations.ts`**
- In `revalidateTripPaths` (lines 92-95), add:
  ```tsx
  revalidatePath(`/${locale}/trips`);
  ```

**Modify: `src/app/[locale]/trips/new/page.tsx`**
- Line 34: change cancel link from `href={`/${locale}`}` to `href={`/${locale}/trips`}`.

### Translation Keys

**en.json** — add to `"trips"`:
```json
"welcome": "Welcome, {name}",
"totalTrips": "{count} trips",
"totalDestinations": "{count} destinations",
"goToTrips": "Go to my trips"
```

**es.json** — add to `"trips"`:
```json
"welcome": "Bienvenido, {name}",
"totalTrips": "{count} viajes",
"totalDestinations": "{count} destinos",
"goToTrips": "Ir a mis viajes"
```

### Acceptance Criteria
- [x] `/{locale}/` shows the welcome landing with greeting, stats (trip count, destination count), and CTA button.
- [x] `/{locale}/trips` shows the trip list (exact same UI as current home page).
- [x] Creating/deleting a trip updates both the landing stats and the trip list.
- [x] Cancel button on new trip form goes to `/{locale}/trips`.
- [x] Authenticated users hitting `/{locale}/` see the landing page (not a redirect).

### Task 2 Implementation Summary (Completed)

- Created `src/app/[locale]/trips/page.tsx` and moved the full trip list experience there:
  - preserved auth/session guard and redirect to `/{locale}/login`
  - preserved data loading with `getUserTrips` + `getTripDestinationStats`
  - preserved listing UI behavior (`ImportTripButton`, `CreateTripButton`, empty state, `TripCard` grid)
  - named the page component `TripsListPage` as specified
- Replaced `src/app/[locale]/page.tsx` with a landing dashboard:
  - kept authenticated access (authenticated users stay on `/{locale}` instead of being redirected)
  - extended `SessionUser` typing to include `name`
  - added localized welcome/tagline section
  - added two quick-stat cards (total trips + total destinations)
  - added CTA link to `/{locale}/trips`
- Updated revalidation paths so landing stats and trips list stay synchronized:
  - `src/app/actions/trips.ts`: added `revalidatePath(\`/${locale}/trips\`)` in
    - `createTripForLocaleAction`
    - `deleteTripForLocaleAction`
    - `updateTripTitleAction`
    - `importTripFromDataAction`
  - `src/app/actions/destinations.ts`: updated `revalidateTripPaths` to also revalidate `/${locale}/trips`
- Updated `src/app/[locale]/trips/new/page.tsx` cancel navigation to `/{locale}/trips`
- Added new Task 2 translations:
  - `src/messages/en.json`: `welcome`, `totalTrips`, `totalDestinations`, `goToTrips`
  - `src/messages/es.json`: `welcome`, `totalTrips`, `totalDestinations`, `goToTrips`
- Verification completed:
  - `npm run lint` passed (existing warning remains in `src/components/layout/header.tsx` for `<img>`)
  - `npm run build` passed successfully

---

## Task 3: Header logo clickable (Req #1)

### Problem
The logo in `header.tsx` (lines 22-29) is a plain `<div>` + `<span>`, not a link.

### Changes

**Modify: `src/components/layout/header.tsx`**
- Add `locale` to `HeaderProps`:
  ```tsx
  type HeaderProps = { userName?: string | null; userImage?: string | null; locale: string; };
  ```
- Import `Link` from `next/link`.
- Wrap the logo container (the `<div className="flex items-center gap-2">` on line 22) in a `<Link>`:
  ```tsx
  <Link href={`/${locale}`} className="flex items-center gap-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
      <MapPin className="h-4 w-4 text-white" />
    </div>
    <span className="text-lg font-bold tracking-tight">
      Trip<span className="text-primary-600">AI</span>visor
    </span>
  </Link>
  ```

**Modify: `src/app/[locale]/layout.tsx`**
- Pass `locale` to Header: `<Header locale={locale} userName={...} userImage={...} />`.

### Acceptance Criteria
- [x] Clicking the logo/brand name from any page navigates to `/{locale}`.
- [x] The logo has pointer cursor on hover.
- [x] No visual change to the logo appearance.

### Task 3 Implementation Summary (Completed)

- Updated `src/components/layout/header.tsx` to make the brand/logo clickable:
  - added `locale: string` to `HeaderProps`
  - imported `Link` from `next/link`
  - replaced the static brand wrapper `<div>` with `<Link href={`/${locale}`}>` while preserving the same internal icon/text markup and classes
- Updated `src/app/[locale]/layout.tsx` to pass locale into header:
  - changed `<Header userName={...} userImage={...} />` to `<Header locale={locale} userName={...} userImage={...} />`
- Behavioral result:
  - clicking the logo now routes to the localized homepage (`/{locale}`)
  - pointer cursor behavior is provided by native link semantics
  - no visual regressions were introduced because brand styling/classes were kept unchanged
- Verification completed:
  - `npm run lint` passed (existing warning remains: `@next/next/no-img-element` in `src/components/layout/header.tsx`)
  - `npm run build` passed successfully

---

## Task 4: User menu with logout + language toggle + settings (Req #11)

### Problem
The user avatar in the header is a static image with no interactivity. Users cannot log out.

### Changes

**New file: `src/components/layout/user-menu.tsx`** — client component

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, LogOut, Settings } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  userName: string | null;
  userImage: string | null;
  locale: string;
};
```

**Behavior:**
- State: `const [open, setOpen] = useState(false)`.
- Click avatar button → toggles dropdown.
- Click-outside handler (same pattern as `destination-list.tsx` lines 64-74): listen to `document 'click'`, check if `target` is outside the ref container, close if so.
- Avatar rendering: same markup as current `header.tsx` lines 32-42 (image or initials fallback). Move the initials computation logic here.

**Dropdown structure:**
```
┌─────────────────────┐
│  User Name           │  ← non-interactive, text-sm font-medium
├─────────────────────┤
│  🌐 English         │  ← full-width menu item
│  🌐 Español         │  ← full-width menu item
│  ✓ Active locale    │  ← check icon shown on selected language
│  ⚙️ Settings        │  ← disabled, text-slate-400, cursor-not-allowed
├─────────────────────┤
│  🚪 Sign out        │  ← red on hover
└─────────────────────┘
```

- **Language toggle:** Reuse the `replaceLocale` logic from `src/components/layout/locale-switcher.tsx` (lines 7-21). Copy the function into user-menu.tsx (it's 10 lines, not worth extracting to a shared util). Use `useLocale()`, `useRouter()`, `usePathname()` (same hooks as LocaleSwitcher).

- **Settings:** Render as a `<div>` (not button) with `className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 cursor-not-allowed"`. Add a small "(Coming soon)" suffix or a tooltip.

- **Logout:**
  ```tsx
  const handleSignOut = async () => {
    await signOut();
    window.location.href = `/${locale}/login`;
  };
  ```
  Use `window.location.href` (hard navigation) to ensure cookies clear and middleware runs fresh. Do NOT use `router.push`.

**Dropdown styles** (same pattern as destination card action menu):
```tsx
className="absolute right-0 top-full z-50 mt-2 min-w-[200px] animate-fade-in rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
```

**Avatar alignment adjustment:**
- Keep the avatar trigger at a fixed `h-8 w-8` with centered flex content and `leading-none`.
- Render avatar image as `display: block` to avoid baseline/inline offset.

**Modify: `src/components/layout/header.tsx`**
- Import `UserMenu` from `./user-menu`.
- Replace the avatar block (lines 32-42) with:
  ```tsx
  <UserMenu userName={userName} userImage={userImage} locale={locale} />
  ```
- Remove the `initials` computation (lines 10-17) — it moves to UserMenu.
- Remove `LocaleSwitcher` import and usage (line 31) — language toggle moves to UserMenu.

### Translation Keys

**en.json** — add to `"auth"`:
```json
"settings": "Settings",
"comingSoon": "Coming soon",
"language": "Language"
```

**es.json** — add to `"auth"`:
```json
"settings": "Configuración",
"comingSoon": "Próximamente",
"language": "Idioma"
```

### Acceptance Criteria
- [x] Clicking user avatar opens a dropdown menu.
- [x] Dropdown shows user name, language toggle (ES/EN), disabled Settings with "Coming soon", and Sign out.
- [x] Language toggle switches the locale (URL updates, page re-renders in new language).
- [x] Sign out clears session and redirects to login page.
- [x] Clicking outside the dropdown closes it.
- [x] LocaleSwitcher is no longer rendered separately in the header.

### Task 4 Implementation Summary (Completed)

- Added `src/components/layout/user-menu.tsx` as a client component and moved user avatar behavior into a dropdown menu:
  - avatar button toggles menu open/closed
  - click-outside listener closes the menu when clicking outside the menu container
  - avatar rendering preserves existing image/initials behavior from the header
- Implemented dropdown content and actions:
  - user name display row
  - language selector rendered as full-width `English` / `Español` menu items with active checkmark
  - locale switching still uses the same `replaceLocale` path-rewrite logic previously used by `LocaleSwitcher`
  - disabled settings row with translated "Coming soon" suffix
  - sign-out action using `signOut()` followed by hard navigation to `/${locale}/login`
- Updated `src/components/layout/header.tsx`:
  - removed `LocaleSwitcher` import/usage
  - removed avatar/initials rendering logic from header
  - rendered `<UserMenu locale={locale} userName={userName} userImage={userImage} />` instead
- Follow-up UX refinements applied after initial Task 4 implementation:
  - centered avatar badge vertically by setting fixed-size trigger button layout (`h-8 w-8`, centered flex, `leading-none`)
  - removed explicit `setOpen(false)` on locale click; menu is no longer intentionally closed by the click handler
  - note: locale navigation can still remount UI state depending on route transition, so menu persistence across locale change is not guaranteed
- Added new auth translation keys for Task 4:
  - `src/messages/en.json`: `settings`, `comingSoon`, `language`
  - `src/messages/es.json`: `settings`, `comingSoon`, `language`
- Verification completed:
  - `npm run lint` passed (warning: `@next/next/no-img-element` in `src/components/layout/user-menu.tsx`)
  - `npm run build` passed successfully

---

## Task 5: Back navigation from trip edit (Req #5)

### Problem
No way to navigate back from `/{locale}/trips/[tripId]` to the trip list.

### Changes

**Modify: `src/app/[locale]/trips/[tripId]/page.tsx`**
- Import `ArrowLeft` from `lucide-react` and `Link` from `next/link`.
- Add `getTranslations` call for the `'trips'` namespace (currently not imported in this file).
- Insert a back link as the first child inside `<main>`, before TripHeader:

```tsx
const tTrips = await getTranslations({ locale, namespace: 'trips' });

// Inside return, first child of <main>:
<Link
  href={`/${locale}/trips`}
  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
>
  <ArrowLeft className="h-4 w-4" />
  {tTrips('backToTrips')}
</Link>
```

### Translation Keys

**en.json** — add to `"trips"`:
```json
"backToTrips": "Back to trips"
```

**es.json** — add to `"trips"`:
```json
"backToTrips": "Volver a viajes"
```

### Acceptance Criteria
- [x] Trip edit page shows "Back to trips" link with arrow icon at the top.
- [x] Clicking the link navigates to `/{locale}/trips`.
- [x] Text is localized in both ES and EN.

### Task 5 Implementation Summary (Completed)

- Updated `src/app/[locale]/trips/[tripId]/page.tsx`:
  - imported `ArrowLeft` from `lucide-react`
  - imported `Link` from `next/link`
  - imported `getTranslations` from `next-intl/server`
  - initialized `tTrips` with `getTranslations({ locale, namespace: 'trips' })`
  - added a localized back link as the first element inside `<main>` that routes to `/${locale}/trips`
- Updated trip translation dictionaries:
  - `src/messages/en.json`: added `trips.backToTrips = "Back to trips"`
  - `src/messages/es.json`: added `trips.backToTrips = "Volver a viajes"`
- Behavior achieved:
  - trip detail/editor page now includes a visible back affordance with arrow icon
  - navigation target is the localized trips index route
  - link label is localized for both English and Spanish
- Verification completed:
  - `npm run lint` passed (existing warning persists: `@next/next/no-img-element` in `src/components/layout/user-menu.tsx`)
  - `npm run build` passed successfully

---

## Task 6: Editable departure/return city (Req #3)

### Problem
Departure city is hardcoded to `'Buenos Aires'` in `src/app/actions/trips.ts:27`. The creation form only collects a title. The city banner on the trip page is static.

### Changes

**Modify: `src/app/[locale]/trips/new/page.tsx`**
- Add labeled inputs for departure and return city to the form. Use existing `Label` component from `@/components/ui/label` (already used in `destination-modal.tsx`):

```tsx
import { Label } from '@/components/ui/label';

// Inside the form, after the title input:
<div className="space-y-1">
  <Label>{tTrips('departureCity')}</Label>
  <Input name="departure_city" placeholder={tTrips('departureCityPlaceholder')} />
</div>
<div className="space-y-1">
  <Label>{tTrips('returnCity')}</Label>
  <Input name="return_city" placeholder={tTrips('returnCityPlaceholder')} />
</div>
```

**Modify: `src/app/actions/trips.ts`**
- In `createTripForLocaleAction`, after creating the trip, extract and save cities:
  ```tsx
  const departureCity = (typeof formData.get('departure_city') === 'string'
    ? formData.get('departure_city')!.trim()
    : '') || DEFAULT_DEPARTURE_CITY;
  const returnCityRaw = typeof formData.get('return_city') === 'string'
    ? formData.get('return_city')!.trim()
    : '';
  const returnCity = returnCityRaw || null;

  await updateTrip(trip.trip_id, { departure_city: departureCity, return_city: returnCity });
  ```

- Add new server action for inline city editing:
  ```tsx
  export async function updateTripCitiesAction(input: {
    locale: string;
    tripId: number;
    departureCity: string;
    returnCity: string | null;
  }): Promise<void> {
    const { locale, tripId, departureCity, returnCity } = input;
    await requireUserId(locale);
    if (!Number.isFinite(tripId)) return;
    const safeDepartureCity = departureCity.trim() || DEFAULT_DEPARTURE_CITY;
    const safeReturnCity = returnCity?.trim() || null;
    await updateTrip(tripId, { departure_city: safeDepartureCity, return_city: safeReturnCity });
    revalidatePath(`/${locale}/trips/${tripId}`);
    revalidatePath(`/${locale}/trips`);
  }
  ```

**New file: `src/components/trips/trip-city-banner.tsx`** — client component
- Props: `locale: string`, `tripId: number`, `departureCity: string`, `returnCity: string | null`.
- State: `editingDeparture: boolean`, `editingReturn: boolean`, `localDepartureCity: string`, `localReturnCity: string`.
- Default display: same visual as current banner (`src/app/[locale]/trips/[tripId]/page.tsx:68-80`) — PlaneTakeoff icon + city name + dashed line + city name + PlaneLanding icon.
- Click on either city name → toggles to an `<Input>` with the current value. On blur or Enter → calls `updateTripCitiesAction` via `useTransition`. On Escape → cancels edit.
- Use same styling as current banner (`rounded-xl border border-slate-200 bg-gradient-to-r from-primary-50/50 to-white p-5`).

**Modify: `src/app/[locale]/trips/[tripId]/page.tsx`**
- Replace the static banner (lines 68-80) with:
  ```tsx
  <TripCityBanner
    locale={locale}
    tripId={trip.trip_id}
    departureCity={trip.departure_city}
    returnCity={trip.return_city}
  />
  ```

### Translation Keys

**en.json** — add to `"trips"`:
```json
"departureCity": "Departure city",
"returnCity": "Return city",
"departureCityPlaceholder": "e.g., Buenos Aires",
"returnCityPlaceholder": "Same as departure if empty"
```

**es.json** — add to `"trips"`:
```json
"departureCity": "Ciudad de salida",
"returnCity": "Ciudad de regreso",
"departureCityPlaceholder": "Ej: Buenos Aires",
"returnCityPlaceholder": "Igual que salida si se deja vacío"
```

### Acceptance Criteria
- [x] New trip creation form has departure and return city inputs with labels.
- [x] If departure city is left blank, defaults to "Buenos Aires".
- [x] If return city is left blank, it's stored as null (displays same as departure city).
- [x] On trip edit page, clicking a city name makes it editable inline.
- [x] Changes save on blur/Enter, cancel on Escape.
- [x] Existing trips with "Buenos Aires" hardcoded still display correctly.

### Task 6 Implementation Summary (Completed)

- Updated `src/app/[locale]/trips/new/page.tsx` to collect cities at creation time:
  - imported and used `Label`
  - added labeled `departure_city` and `return_city` inputs under the trip title field
  - wired placeholders to localized strings (`departureCityPlaceholder`, `returnCityPlaceholder`)
- Updated `src/app/actions/trips.ts` in `createTripForLocaleAction`:
  - parsed `departure_city` and `return_city` from `formData`
  - normalized empty/whitespace values
  - enforced fallback to `DEFAULT_DEPARTURE_CITY` for empty departure city
  - persisted both values immediately after trip creation with `updateTrip`
- Added `updateTripCitiesAction` in `src/app/actions/trips.ts`:
  - validates/authenticates with `requireUserId(locale)`
  - normalizes payload (`departureCity` fallback to default, `returnCity` empty to `null`)
  - updates trip city fields via `updateTrip`
  - revalidates both `/${locale}/trips` and `/${locale}/trips/${tripId}`
- Added new client component `src/components/trips/trip-city-banner.tsx`:
  - preserves existing banner visuals (PlaneTakeoff, dashed connector, PlaneLanding)
  - supports inline edit on both city names
  - saves on blur and Enter using `useTransition` + `updateTripCitiesAction`
  - cancels on Escape and restores previous values
  - displays return city fallback to departure city when return city is unset
- Updated `src/app/[locale]/trips/[tripId]/page.tsx`:
  - removed static city banner markup
  - replaced it with `<TripCityBanner ... />` wired to trip locale/id/city values
- Added Task 6 translation keys in both locales:
  - `src/messages/en.json`: `departureCity`, `returnCity`, `departureCityPlaceholder`, `returnCityPlaceholder`
  - `src/messages/es.json`: `departureCity`, `returnCity`, `departureCityPlaceholder`, `returnCityPlaceholder`
- Verification completed:
  - `npm run lint` passed (existing warning remains: `@next/next/no-img-element` in `src/components/layout/user-menu.tsx`)
  - `npm run build` passed successfully

---

## Task 7: Editable trip dates — start and end (Req #2)

### Problem
Trip dates are non-editable. The start date can only be set during import. There's no `end_date` column.

### DB Migration

**New file: `supabase/migrations/YYYYMMDD_add_end_date.sql`**
```sql
ALTER TABLE trips ADD COLUMN end_date DATE;
```

### Changes

**Modify: `src/types/database.ts`**
- Add `end_date: string | null` to the `Trip` interface (after `start_date`).

**Modify: `src/lib/db/queries/trips.ts`**
- Update the `updateTrip` function signature to include `end_date`:
  ```tsx
  updates: Partial<Pick<Trip, 'title' | 'start_date' | 'end_date' | 'departure_city' | 'return_city'>>
  ```

**Modify: `src/app/actions/trips.ts`**
- Add new server action:
  ```tsx
  export async function updateTripDatesAction(input: {
    locale: string;
    tripId: number;
    startDate: string | null;
    endDate: string | null;
  }): Promise<void> {
    const { locale, tripId, startDate, endDate } = input;
    await requireUserId(locale);
    if (!Number.isFinite(tripId)) return;
    await updateTrip(tripId, { start_date: startDate || null, end_date: endDate || null });
    revalidatePath(`/${locale}/trips/${tripId}`);
    revalidatePath(`/${locale}/trips`);
  }
  ```

**Modify: `src/components/trips/trip-header.tsx`**
- Add `endDate: string | null` to `TripHeaderProps`.
- Replace the read-only date badge (lines 124-129) with two `<input type="date">` elements.
- Add local state for both dates and a validation error:
  ```tsx
  const [localStartDate, setLocalStartDate] = useState(startDate ?? '');
  const [localEndDate, setLocalEndDate] = useState(endDate ?? '');
  const [dateError, setDateError] = useState<string | null>(null);
  ```
- On start date change: validate using `validateEndDate` from `src/lib/utils/dates.ts` if end date is also set. Call `updateTripDatesAction`.
- On end date change: validate that `endDate >= startDate` and that the date range `(end - start)` in days is `>= totalDays`. If not, show an error message and do NOT save. Use existing `validateEndDate(startDate, newEndDate, totalDays)`:
  ```tsx
  import { validateEndDate } from '@/lib/utils/dates';

  const handleEndDateChange = (newEndDate: string) => {
    setLocalEndDate(newEndDate);
    if (!localStartDate) {
      setDateError(tTrips('setStartDateFirst'));
      return;
    }
    const result = validateEndDate(localStartDate, newEndDate, totalDays);
    if (!result.valid) {
      if (result.error === 'endDateBeforeStart') {
        setDateError(tTrips('endDateBeforeStart'));
      } else if (result.error === 'endDateCollision') {
        setDateError(tTrips('endDateTooEarly', { days: totalDays }));
      }
      return;
    }
    setDateError(null);
    startTransition(async () => {
      await updateTripDatesAction({ locale, tripId, startDate: localStartDate, endDate: newEndDate });
    });
  };
  ```

- The date display area layout:
  ```tsx
  <div className="mt-4 flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-500">{tTrips('startDate')}</label>
      <input type="date" value={localStartDate} onChange={...} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
    </div>
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-500">{tTrips('endDate')}</label>
      <input type="date" value={localEndDate} onChange={...} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
    </div>
    {totalDays > 0 && (
      <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
        {tTrips('days', { count: totalDays })}
      </span>
    )}
    {/* Export + Share buttons (existing) */}
    <div className="flex gap-2 ml-auto">...</div>
  </div>
  {dateError && <p className="mt-2 text-sm text-red-600">{dateError}</p>}
  ```

**Modify: `src/app/[locale]/trips/[tripId]/page.tsx`**
- Pass `endDate={trip.end_date}` to `<TripHeader>`.

### Translation Keys

**en.json** — add to `"trips"`:
```json
"startDateLabel": "Start",
"endDateLabel": "End",
"endDateBeforeStart": "End date cannot be before start date",
"endDateTooEarly": "End date too early: destinations require at least {days} days",
"setStartDateFirst": "Set a start date first"
```

**es.json** — add to `"trips"`:
```json
"startDateLabel": "Inicio",
"endDateLabel": "Fin",
"endDateBeforeStart": "La fecha de fin no puede ser anterior a la de inicio",
"endDateTooEarly": "Fecha de fin muy temprana: los destinos requieren al menos {days} días",
"setStartDateFirst": "Primero configura la fecha de inicio"
```

### Acceptance Criteria
- [ ] Start and end date pickers are visible in the trip header.
- [ ] Setting start date saves immediately.
- [ ] Setting end date before start date shows error, does NOT save.
- [ ] Setting end date that gives fewer days than destination total shows error, does NOT save.
- [ ] Valid end date saves correctly.
- [ ] Both pickers sync with server state (refresh shows saved values).

---

## Task 8: Days input label (Req #7)

### Problem
The duration input in the add-city form (`destination-list.tsx:277-285`) has no label — only a placeholder "Days". The city input also lacks a label.

### Changes

**Modify: `src/components/trips/destination-list.tsx`**
- In the `addDestinationForm` function (line 256), wrap each input in a labeled container:

```tsx
// Replace the bare <Input> elements (lines 270-285) with:
<div className="flex flex-col flex-[2] gap-1">
  <label className="text-xs font-medium text-slate-500">{tDestinations('city')}</label>
  <Input
    disabled={isPending}
    onChange={(event) => setNewCity(event.target.value)}
    placeholder={locale === 'es' ? 'Nueva Ciudad' : 'New City'}
    value={newCity}
  />
</div>
<div className="flex flex-col flex-1 gap-1">
  <label className="text-xs font-medium text-slate-500">{tDestinations('duration')}</label>
  <Input
    disabled={isPending}
    min={1}
    onChange={(event) => setNewDuration(event.target.value)}
    placeholder={locale === 'es' ? 'Días' : 'Days'}
    type="number"
    value={newDuration}
  />
</div>
```

Existing translation keys reused: `destinations.city` ("City" / "Ciudad") and `destinations.duration` ("Duration (days)" / "Duración (días)").

### Date auto-adjustment on drag-and-drop
Already works correctly. `getDestinationDates` in `src/lib/utils/dates.ts:30-48` computes dates from cumulative durations at each index. When drag-and-drop reorders items (`destination-list.tsx:87-117`), positions are normalized and the `items` state updates, causing all `DestinationCard` components to re-render with recalculated dates. No code changes needed — verify visually.

### Acceptance Criteria
- [ ] "City" and "Duration (days)" labels are visible above the inputs in the add-city form.
- [ ] Labels use the correct locale translation.
- [ ] Drag-and-drop a destination: date ranges on all cards update correctly to reflect new order.

---

## Task 9: Date range on each city card (Req #8)

### Already Implemented
`destination-card.tsx:212-248` already computes and displays `dateRange` via `getDestinationDates`. When `startDate` is set on the trip, each card shows "Jan 15 - Jan 17" style dates. When `startDate` is null, dates are hidden.

### Acceptance Criteria
- [ ] Set a start date on a trip with destinations. Each destination card shows its date range.
- [ ] Date format matches the locale (en-US or es-ES).
- [ ] No code changes needed — visual verification only.

---

## Task 10: Insert city at any position in timeline (Req #9)

### Problem
The add-city form is only at the bottom of the timeline. Users can only add cities at the end and then drag-and-drop to reorder.

### Changes

**Modify: `src/lib/db/queries/destinations.ts`**
- Add a `shiftDestinationsDown` function. When inserting at a specific position, existing destinations at that position or higher need their position incremented:

```tsx
async function shiftDestinationsDown(tripId: number, fromPosition: number): Promise<void> {
  const supabase = createAdminClient();

  // Get all destinations at or after the target position, ordered descending
  // (update from highest to lowest to avoid unique constraint conflicts if any)
  const { data, error: fetchError } = await supabase
    .from('destinations')
    .select('destination_id, position')
    .eq('trip_id', tripId)
    .gte('position', fromPosition)
    .order('position', { ascending: false });

  if (fetchError) throw fetchError;

  for (const dest of (data ?? []) as Pick<Destination, 'destination_id' | 'position'>[]) {
    const { error } = await supabase
      .from('destinations')
      .update({ position: dest.position + 1 })
      .eq('destination_id', dest.destination_id);
    if (error) throw error;
  }
}
```

- Modify `createDestination` to call `shiftDestinationsDown` when an explicit position is provided:
  ```tsx
  const resolvedPosition = typeof position === 'number' && Number.isFinite(position)
    ? Math.max(0, Math.trunc(position))
    : await getNextDestinationPosition(tripId);

  // NEW: if inserting at a specific position (not appending), shift existing destinations
  if (typeof position === 'number' && Number.isFinite(position)) {
    await shiftDestinationsDown(tripId, resolvedPosition);
  }
  ```

**Modify: `src/app/actions/destinations.ts`**
- Add optional `position` parameter to `createDestinationAction`:
  ```tsx
  export async function createDestinationAction(input: {
    locale: string;
    tripId: number;
    city: string;
    duration: number;
    position?: number;  // NEW
  }): Promise<Destination> {
    // ... existing validation ...
    const destination = await createDestination(tripId, city, duration, input.position);
    // ... existing revalidation ...
  }
  ```

**Modify: `src/components/trips/destination-list.tsx`**
- Add state: `const [insertAtPosition, setInsertAtPosition] = useState<number | null>(null);`
- Between each destination card in the timeline, render an insert button. Inside the `items.map(...)` block, before each card's `<div key={...}>`, render:

```tsx
{/* Insert button — shown before each destination except when form is open at this position */}
{insertAtPosition !== index && (
  <div className="relative flex items-center py-1">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-0.5 h-full bg-slate-200" />
    <button
      type="button"
      onClick={() => setInsertAtPosition(index)}
      className="relative z-10 ml-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400 opacity-0 hover:opacity-100 hover:border-primary-400 hover:text-primary-500 transition-all"
      title={tDestinations('insertHere')}
    >
      <Plus className="h-3 w-3" />
    </button>
  </div>
)}
```

- When `insertAtPosition` is set, render the add form at that position instead of at the bottom:
  ```tsx
  {insertAtPosition === index && addDestinationForm(true, index)}
  ```

- Modify `addDestinationForm` to accept an optional position parameter:
  ```tsx
  const addDestinationForm = (showTimelineNode: boolean, atPosition?: number) => (
    <form className="relative flex gap-4" onSubmit={(e) => handleAddDestination(e, atPosition)}>
      {/* If atPosition is defined, also show a cancel button */}
      ...
    </form>
  );
  ```

- Modify `handleAddDestination` to accept and pass position:
  ```tsx
  const handleAddDestination = (event: FormEvent<HTMLFormElement>, atPosition?: number) => {
    event.preventDefault();
    // ... existing validation ...
    startTransition(async () => {
      const createdDestination = await createDestinationAction({
        locale, tripId, city: trimmedCity, duration,
        position: atPosition  // undefined when adding at bottom (auto-appends)
      });
      // Optimistic update: insert at correct index
      setItems((prev) => {
        const next = [...prev];
        const newDest = { ...createdDestination, transport: null, accommodation: null };
        if (typeof atPosition === 'number') {
          next.splice(atPosition, 0, newDest);
          return withNormalizedPositions(next);
        }
        return sortByPosition([...prev, newDest]);
      });
      setInsertAtPosition(null);
      setNewCity('');
      setNewDuration('2');
    });
  };
  ```

### Translation Keys

**en.json** — add to `"destinations"`:
```json
"insertHere": "Add city here"
```

**es.json** — add to `"destinations"`:
```json
"insertHere": "Agregar ciudad aquí"
```

### Acceptance Criteria
- [ ] Hovering between two destinations reveals a small "+" insert button.
- [ ] Clicking the insert button shows the add-city form at that position.
- [ ] Submitting the form creates the destination at the correct position.
- [ ] Existing destinations shift down (their positions increment).
- [ ] The timeline numbers update correctly after insertion.
- [ ] Adding at the bottom (default form) still works unchanged.
- [ ] Drag-and-drop reordering still works after insertion.

---

## Task 11: End of trip / return card (Req #6)

### Problem
There's no UI for viewing/editing return transport details. The DB already supports `return_transport` (transport with `trip_id` + `transport_role='return'`), and `getTripById` already fetches it.

### Changes

**New file: `src/components/trips/return-card.tsx`** — client component

- Props: `locale: string`, `tripId: number`, `returnCity: string`, `returnDate: string | null`, `returnTransport: Transport | null`.
- Renders a card styled like a destination card but with distinct accent:
  - Timeline node: filled circle with `PlaneLanding` icon (primary-700 bg, white icon) instead of a number.
  - Card title: "End of trip — {returnCity}" (localized).
  - Date: the return date formatted using `formatDate` from `src/lib/utils/dates.ts`.
  - Transport details: if `returnTransport` exists, display using the same `getTransportDetails`-style rendering as in `destination-card.tsx`. Reuse the helper functions (or duplicate the few needed — `getTransportLabel`, `getTransportIconByType`, `getTransportDetails`).
  - Edit button: opens the return transport modal.

**New file: `src/components/trips/return-transport-modal.tsx`** — client component

- Props: `locale: string`, `tripId: number`, `transport: Transport | null`, `open: boolean`, `isPending: boolean`, `onCancel: () => void`, `onSave: (payload) => void`.
- Modal structure: follow the same pattern as `destination-modal.tsx` but with **only the transport section** (no city/duration/accommodation/notes/budget).
- Transport form fields (7 fields): transport_type (Select), leave_accommodation_time (time), terminal (text), company (text), booking_number (text), booking_code (text), departure_time (time).
- Use the same `strings` pattern as `destination-modal.tsx` for field labels.
- On submit, normalize fields with `toNullable` (same function as in destination-modal) and call `onSave` with the payload.

**Modify: `src/app/actions/trips.ts`**
- Add server action:
  ```tsx
  export async function updateReturnTransportAction(input: {
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
    };
  }): Promise<Transport> {
    const { locale, tripId, transport } = input;
    await requireUserId(locale);
    if (!Number.isFinite(tripId)) throw new Error('Invalid trip id.');
    const result = await upsertTransport({
      trip_id: tripId,
      transport_role: 'return',
      ...transport
    });
    revalidatePath(`/${locale}/trips/${tripId}`);
    return result;
  }
  ```
  Import `upsertTransport` from `@/lib/db/queries/transports` (already imported for import feature).

**Modify: `src/components/trips/destination-list.tsx`**
- Add optional props: `returnCity?: string`, `returnDate?: string | null`, `returnTransport?: Transport | null`.
- After the last destination item (and before the bottom add form), render `<ReturnCard>` when `returnCity` is provided.
- The return card sits inside the timeline, so it gets a timeline node and connects to the vertical line.

**Modify: `src/app/[locale]/trips/[tripId]/page.tsx`**
- Compute return date using existing utility:
  ```tsx
  import { calculateDate } from '@/lib/utils/dates';
  const returnDate = calculateDate(trip.start_date, totalDays);
  ```
- Pass to DestinationList:
  ```tsx
  <DestinationList
    destinations={trip.destinations}
    locale={locale}
    startDate={trip.start_date}
    tripId={trip.trip_id}
    returnCity={trip.return_city ?? trip.departure_city}
    returnDate={returnDate}
    returnTransport={trip.return_transport}
  />
  ```

### Translation Keys

**en.json** — add to `"trips"`:
```json
"endOfTrip": "End of trip",
"editReturn": "Edit return details"
```

**es.json** — add to `"trips"`:
```json
"endOfTrip": "Fin del viaje",
"editReturn": "Editar detalles del regreso"
```

### Acceptance Criteria
- [ ] "End of trip" card appears at the bottom of the destination timeline.
- [ ] Shows return city name and computed return date.
- [ ] Clicking edit opens a modal with transport-only fields.
- [ ] Saving transport details persists them (reload shows saved data).
- [ ] If no return transport exists, the card shows the city/date with an "Edit return details" button.
- [ ] Card integrates visually into the timeline with a distinct node (PlaneLanding icon).

---

## New Files Summary

| File | Type | Purpose |
|------|------|---------|
| `src/app/[locale]/trips/page.tsx` | Server | Trip list page |
| `src/components/trips/trip-city-banner.tsx` | Client | Editable departure/return city |
| `src/components/trips/return-card.tsx` | Client | End-of-trip return card |
| `src/components/trips/return-transport-modal.tsx` | Client | Return transport editing modal |
| `src/components/layout/user-menu.tsx` | Client | User avatar dropdown |
| `supabase/migrations/YYYYMMDD_add_end_date.sql` | SQL | Add end_date column |

## Modified Files Summary

| File | Tasks |
|------|-------|
| `src/components/trips/destination-card.tsx` | #1 |
| `src/app/[locale]/page.tsx` | #2 |
| `src/app/[locale]/layout.tsx` | #3 |
| `src/app/[locale]/trips/new/page.tsx` | #2, #6 |
| `src/app/[locale]/trips/[tripId]/page.tsx` | #5, #6, #7, #11 |
| `src/components/layout/header.tsx` | #3, #4 |
| `src/components/trips/trip-header.tsx` | #7 |
| `src/components/trips/destination-list.tsx` | #8, #10, #11 |
| `src/app/actions/trips.ts` | #2, #6, #7, #11 |
| `src/app/actions/destinations.ts` | #2, #10 |
| `src/lib/db/queries/trips.ts` | #7 |
| `src/lib/db/queries/destinations.ts` | #10 |
| `src/types/database.ts` | #7 |
| `src/messages/en.json` | #2, #4, #5, #6, #7, #10, #11 |
| `src/messages/es.json` | #2, #4, #5, #6, #7, #10, #11 |

## Existing Functions/Utils to Reuse

| Function | File | Used in Tasks |
|----------|------|---------------|
| `signOut` | `src/lib/auth-client.ts` | #4 |
| `replaceLocale` (logic) | `src/components/layout/locale-switcher.tsx` | #4 |
| `updateTrip` | `src/lib/db/queries/trips.ts` | #6, #7 |
| `upsertTransport` | `src/lib/db/queries/transports.ts` | #11 |
| `validateEndDate` | `src/lib/utils/dates.ts` | #7 |
| `calculateDate` | `src/lib/utils/dates.ts` | #7, #11 |
| `formatDate` | `src/lib/utils/dates.ts` | #11 |
| `getDestinationDates` | `src/lib/utils/dates.ts` | #8, #9 |
| `createDestination` | `src/lib/db/queries/destinations.ts` | #10 |
| `cn` | `src/lib/utils.ts` | all UI tasks |
| `Label` | `src/components/ui/label.tsx` | #6, #8 |

## Verification

1. Run dev server: `npm run dev` (port 5127)
2. Run DB migration before testing Task 7
3. Test each task per its acceptance criteria above
4. Run `npm test` to verify no regressions in existing tests
5. Test both locales (ES and EN) for all new UI strings
6. Test on mobile viewport for responsive layout of new components
