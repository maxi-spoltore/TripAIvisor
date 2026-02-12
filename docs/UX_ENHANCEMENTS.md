# UX/UI Enhancement Plan — TripAIvisor

## Context

TripAIvisor is a functional travel planner, but its UI is visually plain: an all-slate/gray/white palette with no accent colors, minimal branding (plain text "TripAIvisor" in the header), no animations or transitions, native `window.confirm()` for destructive actions, sparse trip cards, bare empty states, and no loading indicators beyond disabled buttons. This plan proposes a full visual refresh across every page and component — polishing the look and feel of existing functionality without adding new features.

---

## Phase 1: Design Foundation — Colors, Font & Global Styles

### Goal
Establish the visual identity that all other phases build on: a travel-themed color palette, a clean font, and reusable CSS utilities for animations.

### Files to modify
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/lib/utils.ts`

### Instructions

**1.1 — Add Inter font via `next/font/google`**

In `src/app/layout.tsx`:
- Import `{ Inter }` from `next/font/google`
- Initialize: `const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })`
- Add `className={inter.variable}` to the `<html>` tag
- In `tailwind.config.ts`, extend `fontFamily`: `sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans]` (import `defaultTheme` from `tailwindcss/defaultTheme`)

**1.2 — Define custom color palette in `tailwind.config.ts`**

Extend the `theme.extend.colors` object with:

```ts
primary: {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',  // main accent (teal-500)
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
},
accent: {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',  // warm amber
},
```

**1.3 — Update `src/app/globals.css`**

Replace the body style and add animation utilities:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  @apply bg-gray-50 font-sans text-slate-900 antialiased;
}

/* Reusable animation utilities */
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 200ms ease-out;
  }
  .animate-slide-up {
    animation: slideUp 200ms ease-out;
  }
  .animate-scale-in {
    animation: scaleIn 200ms ease-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

**1.4 — Update `cn()` utility in `src/lib/utils.ts`**

Install `tailwind-merge` (`npm install tailwind-merge`) and update `cn()`:

```ts
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}
```

This prevents Tailwind class conflicts when overriding component styles.

### Verification
- `npm run build` compiles without errors
- Body uses Inter font, gray-50 background, and antialiased text
- `primary-500` and `accent-400` colors are available in Tailwind IntelliSense

---

## Phase 2: UI Primitives — Button, Card, Input, Textarea, Label, Select

### Goal
Update all base UI components to use the new primary color for focus/active states, add hover transitions, and add a new `destructive` button variant.

### Files to modify
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`

### Instructions

**2.1 — Button (`button.tsx`)**

Update variant classes:
```ts
const variantClasses = {
  default: 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]',
  outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
};
```

Update base classes to add smooth transitions:
```
'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50'
```

Note: `rounded-md` → `rounded-lg` for slightly softer corners. Update the `ButtonProps` type to include `'destructive'` in the variant union.

**2.2 — Card (`card.tsx`)**

Add hover transition to base Card:
```
'rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-shadow duration-200'
```

Note: `rounded-lg` → `rounded-xl` for a more modern feel.

**2.3 — Input (`input.tsx`)**

Update focus ring color from `slate-400` to `primary-500`:
```
'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50'
```

**2.4 — Textarea (`textarea.tsx`)**

Same focus ring update as Input:
```
'min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50'
```

**2.5 — Select (`select.tsx`)**

Update `SelectTrigger` focus/border styling to match Input. Update `SelectItem` hover to `hover:bg-primary-50`. Add `animate-fade-in` to `SelectContent`.

**2.6 — Label (`label.tsx`)**

Add slightly darker color for better contrast: `'text-sm font-medium leading-none text-slate-700'`

### Verification
- All buttons show teal primary color
- Focus rings on inputs/textareas are teal
- Cards have rounded-xl corners
- Destructive button variant renders in red
- `npm run build` and `npm run lint` pass

---

## Phase 3: Header Redesign

### Goal
Transform the plain text header into a branded navigation bar with visual identity and user context.

### Files to modify
- `src/components/layout/header.tsx`
- `src/components/layout/locale-switcher.tsx`
- `src/app/[locale]/layout.tsx` (pass session user to Header)

### Instructions

**3.1 — Header (`header.tsx`)**

Redesign the header:

```tsx
import { MapPin } from 'lucide-react';
import { LocaleSwitcher } from './locale-switcher';

type HeaderProps = {
  userName?: string | null;
  userImage?: string | null;
};

export function Header({ userName, userImage }: HeaderProps) {
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trip<span className="text-primary-600">AI</span>visor
          </span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {initials ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {initials}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
```

Key changes:
- `sticky top-0` with `backdrop-blur-md` and `bg-white/80` for a frosted glass effect
- Brand icon: `MapPin` in a teal rounded square
- "AI" highlighted in teal color
- User initials avatar circle in primary-100 background
- More compact padding (`py-3` instead of `p-4`)

**3.2 — Pass user data to Header**

In `src/app/[locale]/layout.tsx`:
- Import `auth` and `headers` from Next.js
- Fetch the session server-side
- Pass `userName={session?.user?.name}` and `userImage={session?.user?.image}` to `<Header />`
- Handle null session gracefully (login page has no user)

**3.3 — Locale Switcher as pill toggle (`locale-switcher.tsx`)**

Replace the Select dropdown with a compact segmented toggle:

```tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import type { AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

// keep existing replaceLocale function

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;

  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-sm">
      {(['es', 'en'] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          className={cn(
            'rounded-md px-3 py-1 font-medium transition-all duration-150',
            locale === loc
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
          onClick={() => {
            if (loc !== locale) {
              router.push(replaceLocale(pathname, locale, loc));
            }
          }}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

### Verification
- Header shows brand icon + colored "AI" text
- User avatar initials appear when logged in
- Header has frosted glass blur effect on scroll
- Locale toggle switches between ES/EN visually
- Header is sticky and stays on top during scroll

---

## Phase 4: Login Page Refresh

### Goal
Transform the bare login card into an inviting, branded entry point.

### File to modify
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/messages/en.json` and `src/messages/es.json` (add tagline strings)

### Instructions

**4.1 — Add i18n strings**

In `en.json` under `"auth"` add:
```json
"tagline": "Plan your trips, your way",
"welcomeBack": "Welcome back"
```

In `es.json` under `"auth"` add:
```json
"tagline": "Planifica tus viajes, a tu manera",
"welcomeBack": "Bienvenido de nuevo"
```

**4.2 — Redesign login page (`login/page.tsx`)**

```tsx
'use client';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const t = useTranslations('auth');

  const handleGoogleLogin = async () => {
    await signIn.social({ provider: 'google' });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-8">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-200">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Trip<span className="text-primary-600">AI</span>visor
          </h1>
          <p className="text-sm text-slate-500">{t('tagline')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-900">{t('welcomeBack')}</h2>

          <Button className="w-full gap-2" onClick={handleGoogleLogin} type="button">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('continueWithGoogle')}
          </Button>
        </div>
      </div>
    </main>
  );
}
```

Key changes:
- Gradient background using primary and accent palette
- Brand logo with shadow
- Tagline below brand name
- Larger card with rounded-2xl and shadow-xl
- Google "G" SVG icon in the button
- `animate-slide-up` entrance animation

### Verification
- Login page shows gradient background, brand icon, tagline
- Google button has the G icon
- Card animates in on page load
- Works in both `/es/login` and `/en/login` with correct translations

---

## Phase 5: Dashboard & Trip Cards

### Goal
Make the dashboard feel inviting with richer trip cards and a better empty state.

### Files to modify
- `src/app/[locale]/page.tsx`
- `src/components/trips/trip-card.tsx`
- `src/components/trips/create-trip-button.tsx`
- `src/components/trips/import-trip-button.tsx`
- `src/components/trips/delete-trip-button.tsx`
- `src/messages/en.json` and `src/messages/es.json`

### Instructions

**5.1 — Add i18n strings**

In `en.json` add under `"trips"`:
```json
"noTripsTitle": "No trips yet",
"noTripsDescription": "Create your first trip to get started",
"destinations": "{count} destinations",
"noDestinations": "No destinations"
```

Add matching Spanish strings in `es.json`.

**5.2 — Dashboard page (`[locale]/page.tsx`)**

Update the trip grid to use 2 columns on large screens:
```tsx
<div className="grid gap-4 lg:grid-cols-2">
```

Update the empty state to be more visual:
```tsx
{trips.length === 0 ? (
  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
      <MapPin className="h-8 w-8 text-primary-400" />
    </div>
    <div>
      <p className="text-lg font-semibold text-slate-900">{tTrips('noTripsTitle')}</p>
      <p className="mt-1 text-sm text-slate-500">{tTrips('noTripsDescription')}</p>
    </div>
    <CreateTripButton href={`/${locale}/trips/new`} label={tTrips('newTrip')} />
  </div>
) : (
  // grid...
)}
```

Import `MapPin` from lucide-react.

**5.3 — Trip Card (`trip-card.tsx`)**

Redesign the card to show more info and have better visual treatment. The component receives `trip` which has `trip_id`, `title`, `start_date`, `departure_city`, `return_city`. We need to also pass destination count and total days from the parent page.

Update `TripCardProps` to accept `destinationCount: number` and `totalDays: number`.

In the dashboard page, pass these from the trip data (trips query should already include destinations count — if not, we add it).

New card structure:
```tsx
export function TripCard({ locale, trip, editLabel, selectDateLabel, destinationCount, totalDays }: TripCardProps) {
  const deleteTripAction = deleteTripForLocaleAction.bind(null, locale);

  return (
    <Card className="group overflow-hidden hover:shadow-md hover:border-primary-200">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{trip.title}</CardTitle>
          <form action={deleteTripAction}>
            <input name="tripId" type="hidden" value={String(trip.trip_id)} />
            <DeleteTripButton />
          </form>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {trip.start_date ?? selectDateLabel}
          </span>
          {totalDays > 0 ? (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {totalDays} {locale === 'es' ? 'días' : 'days'}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {destinationCount} {locale === 'es' ? 'destinos' : 'destinations'}
          </span>
        </div>

        {/* Action */}
        <Link
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-medium text-white transition-all duration-150 hover:bg-primary-700 active:scale-[0.98]"
          href={`/${locale}/trips/${trip.trip_id}`}
        >
          {editLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
```

Import `Calendar`, `MapPin` from lucide-react.

**5.4 — Delete Trip Button (`delete-trip-button.tsx`)**

Change to an icon-only trash button (smaller, less prominent):
```tsx
import { Trash2 } from 'lucide-react';

export function DeleteTripButton() {
  const tCommon = useTranslations('common');

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(tCommon('confirmDelete'))) {
      event.preventDefault();
    }
  };

  return (
    <button
      onClick={handleClick}
      type="submit"
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      aria-label={tCommon('delete')}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
```

**5.5 — Create Trip Button (`create-trip-button.tsx`)**

Update to use primary color and add a Plus icon:
```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function CreateTripButton({ href, label }: CreateTripButtonProps) {
  return (
    <Link
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-primary-700 active:scale-[0.98]"
      href={href}
    >
      <Plus className="h-4 w-4" />
      {label}
    </Link>
  );
}
```

**5.6 — Import Trip Button (`import-trip-button.tsx`)**

No structural change. Just ensure the `variant="outline"` button uses the updated outline styles from Phase 2.

### Verification
- Dashboard shows 2-column grid on large screens, 1 column on mobile
- Trip cards show accent bar at top, hover with shadow lift and primary border
- Cards show destination count, total days badge, and date with icon
- Empty state shows centered icon + text + CTA
- Delete button is a subtle trash icon
- Create button is primary teal with Plus icon

---

## Phase 6: Trip Editor — Header & Info Card

### Goal
Polish the trip editor page header and the departure/return info card.

### Files to modify
- `src/components/trips/trip-header.tsx`
- `src/app/[locale]/trips/[tripId]/page.tsx`

### Instructions

**6.1 — Trip Header (`trip-header.tsx`)**

Update the header container:
```tsx
<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  {/* Accent bar */}
  <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />

  <div className="p-6">
    {/* Title input — add a hover hint for editability */}
    <div className="group relative">
      <Input
        className="h-auto border-transparent px-0 text-3xl font-bold leading-tight shadow-none focus-visible:ring-0 focus-visible:border-primary-300"
        disabled={isPending}
        onBlur={saveTitle}
        onChange={(event) => setEditingTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        placeholder={tTrips('defaultTitle')}
        value={editingTitle}
      />
      {/* Subtle edit hint underline on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-200 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>

    {/* Date range and actions */}
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {formattedDateRange ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          <Calendar className="h-3.5 w-3.5" />
          {formattedDateRange}
        </span>
      ) : null}

      <div className={`flex gap-2 ${formattedDateRange ? 'ml-auto' : ''}`}>
        <Button onClick={handleExportTrip} type="button" variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {tTrips('export')}
        </Button>
        <Button onClick={() => setIsShareModalOpen(true)} type="button" variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          {tShare('open')}
        </Button>
      </div>
    </div>
  </div>

  <ShareModal ... />
</div>
```

Key changes:
- Top accent gradient bar
- Rounded-xl container
- Date range displayed as a teal pill badge
- Hover underline hint on the editable title
- Smaller buttons (`size="sm"`)

**6.2 — Trip Info Card (departure/return) in `trips/[tripId]/page.tsx`**

Replace the plain text card with a visual route indicator:

```tsx
import { PlaneTakeoff, PlaneLanding } from 'lucide-react';

// ...inside the page component, replace the Card block:
<div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-primary-50/50 to-white p-5">
  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
    <PlaneTakeoff className="h-4 w-4 text-primary-500" />
    <span>{trip.departure_city}</span>
  </div>

  <div className="flex-1 border-t border-dashed border-primary-300" />

  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
    <span>{trip.return_city ?? trip.departure_city}</span>
    <PlaneLanding className="h-4 w-4 text-primary-500" />
  </div>
</div>
```

This replaces the Card+CardHeader+CardContent with a visual route line (`departure → → → return`) using plane icons and a dashed connector.

### Verification
- Trip header has accent bar, editable title with hover underline hint
- Date range shows as teal pill badge
- Departure/return shows as a visual route with plane icons and dashed line
- All buttons use updated primary styles

---

## Phase 7: Destination Cards & Timeline Visual

### Goal
Add a vertical timeline connector between destination cards and polish the card design.

### Files to modify
- `src/components/trips/destination-list.tsx`
- `src/components/trips/destination-card.tsx`

### Instructions

**7.1 — Timeline wrapper in `destination-list.tsx`**

Wrap the destination cards list in a timeline container. The timeline is a vertical line on the left with numbered circles at each card:

```tsx
{items.length === 0 ? (
  // empty state (no change)
) : (
  <div className="relative space-y-0">
    {/* Timeline vertical line */}
    <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />

    {items.map((destination, index) => (
      <div
        key={destination.destination_id}
        draggable={!isPending}
        onDragOver={handleDragOver}
        onDragStart={(event) => handleDragStart(event, index)}
        onDrop={(event) => handleDrop(event, index)}
        className="relative flex gap-4 pb-4"
      >
        {/* Timeline node */}
        <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-300 bg-white text-sm font-bold text-primary-700">
          {index + 1}
        </div>

        {/* Card */}
        <div className="flex-1">
          <DestinationCard ... />
        </div>
      </div>
    ))}
  </div>
)}
```

**7.2 — "Add Destination" form restyled as timeline endpoint**

Restyle the add form to look like a dashed card at the end of the timeline:

```tsx
<form
  className="relative flex gap-4"
  onSubmit={handleAddDestination}
>
  {/* Timeline end node (only show if items exist) */}
  {items.length > 0 ? (
    <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400">
      <Plus className="h-4 w-4" />
    </div>
  ) : null}

  <div className={cn(
    "flex flex-1 gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 transition-colors focus-within:border-primary-400 focus-within:bg-primary-50/30",
    items.length > 0 ? '' : 'ml-0'
  )}>
    <Input
      disabled={isPending}
      onChange={(event) => setNewCity(event.target.value)}
      placeholder={locale === 'es' ? 'Nueva Ciudad' : 'New City'}
      value={newCity}
      className="flex-[2]"
    />
    <Input
      disabled={isPending}
      min={1}
      onChange={(event) => setNewDuration(event.target.value)}
      placeholder={locale === 'es' ? 'Días' : 'Days'}
      type="number"
      value={newDuration}
      className="flex-1"
    />
    <Button disabled={isPending} type="submit">
      {locale === 'es' ? 'Agregar' : 'Add'}
    </Button>
  </div>
</form>
```

Import `Plus` from lucide-react, `cn` from `@/lib/utils`.

**7.3 — Destination Card (`destination-card.tsx`)**

Update the card structure:

1. Remove the outer wrapper div with `isDragging ? 'opacity-60'` — move that class to the timeline row in destination-list.tsx
2. Update the card container:
   ```
   'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md'
   ```
3. Move drag handle behavior — the GripVertical icon is no longer needed as the timeline number circle is the drag handle. Remove the `GripVertical` icon and make the card itself draggable via the parent.
4. Move transport/accommodation icons inline with the city name as small colored badges:
   ```tsx
   <div className="flex items-center gap-2">
     <h3 className="text-lg font-bold text-slate-900">{destination.city || fallbackName}</h3>
     {hasTransport ? (
       <TransportIcon className="h-4 w-4 text-primary-500" />
     ) : null}
     {hasAccommodation ? (
       <Hotel className="h-4 w-4 text-amber-500" />
     ) : null}
   </div>
   ```
5. Duration as a pill badge:
   ```tsx
   <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
     {destination.duration} {locale === 'es' ? 'días' : 'days'}
   </span>
   ```
6. Expand/collapse button — replace the horizontal line divider with a text button:
   ```tsx
   <button
     className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
     onClick={onToggle}
     type="button"
   >
     {expanded
       ? (locale === 'es' ? 'Ocultar detalles' : 'Hide details')
       : (locale === 'es' ? 'Ver detalles' : 'Show details')}
     {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
   </button>
   ```
7. Expanded section — add subtle colored backgrounds per section:
   - Transport section: `bg-primary-50/50 rounded-lg p-3`
   - Accommodation section: `bg-amber-50/50 rounded-lg p-3`
   - Notes: `bg-slate-50 rounded-lg p-3`
   - Budget: `bg-emerald-50/50 rounded-lg p-3`
8. Section headers — use icon + text with the corresponding accent color:
   ```tsx
   <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-700">
     <TransportIcon className="h-4 w-4" />
     {locale === 'es' ? 'Transporte' : 'Transport'}
   </h4>
   ```

**7.4 — Menu dropdown styling**

Update the action menu (MoreVertical) to match the new style:
```
'absolute right-0 top-full z-10 mt-1 min-w-[150px] animate-fade-in rounded-xl border border-slate-200 bg-white py-1 shadow-lg'
```

Add ARIA attributes:
- Menu wrapper: `role="menu"`
- Menu items: `role="menuitem"`
- Trigger button: `aria-label="Actions"` (or i18n equivalent)

### Verification
- Destinations display with a vertical timeline on the left
- Numbered circles (1, 2, 3...) at each card
- Add destination form appears as a dashed endpoint
- Cards have rounded-xl, hover shadow, colored section backgrounds
- "Show details" / "Hide details" text button replaces divider
- Transport icons are teal, Hotel icon is amber
- Duration displayed as a pill badge
- Menu has fade-in animation

---

## Phase 8: Destination Modal Polish

### Goal
Add entrance/exit animations, a close button, dynamic title, and a sticky footer.

### File to modify
- `src/components/trips/destination-modal.tsx`

### Instructions

**8.1 — Backdrop animation**

Update the overlay div to animate:
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
  onClick={() => { if (!isPending) onCancel(); }}
>
```

**8.2 — Modal container animation**

```tsx
<div
  className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in sm:max-h-[85vh]"
  onClick={(event) => event.stopPropagation()}
>
```

On mobile, make it full-screen:
Add responsive classes: `max-sm:max-h-screen max-sm:h-screen max-sm:rounded-none`

**8.3 — Header with dynamic title and close button**

```tsx
<div className="flex items-center justify-between border-b border-slate-200 p-6">
  <h2 className="text-xl font-bold">
    {locale === 'es' ? 'Editar' : 'Edit'} — {formState.city || (locale === 'es' ? 'Destino' : 'Destination')}
  </h2>
  <button
    type="button"
    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
    onClick={() => { if (!isPending) onCancel(); }}
    aria-label="Close"
  >
    <X className="h-5 w-5" />
  </button>
</div>
```

Import `X` from lucide-react.

**8.4 — Section toggle styling**

Replace the ghost buttons for collapsible sections with styled accordion headers that have a colored left border when expanded:

```tsx
<div className={cn(
  'rounded-xl border p-4 transition-colors',
  showTransport ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200'
)}>
  <button
    className="flex w-full items-center justify-between text-left"
    disabled={isPending}
    onClick={() => setShowTransport((prev) => !prev)}
    type="button"
  >
    <span className="flex items-center gap-2 font-semibold text-slate-900">
      <TransportIcon className="h-4 w-4 text-primary-500" />
      {strings.transportTitle}
    </span>
    {showTransport ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
  </button>

  {showTransport ? (
    <div className="mt-4 space-y-4">
      {/* form fields */}
    </div>
  ) : null}
</div>
```

Apply same pattern for Accommodation (amber accent) and Additional (slate accent) sections.

**8.5 — Sticky footer**

Update the footer to be sticky at the bottom:
```tsx
<div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white p-4">
  <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
    {strings.save}
  </Button>
  <Button className="flex-1" disabled={isPending} onClick={onCancel} variant="outline">
    {strings.cancel}
  </Button>
</div>
```

**8.6 — Escape key handling**

Add a `useEffect` to listen for `Escape` key:
```tsx
useEffect(() => {
  if (!open) return;
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isPending) onCancel();
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [open, isPending, onCancel]);
```

### Verification
- Modal backdrop fades in on open
- Modal content scales in with animation
- Dynamic title shows city name
- X close button in top-right corner
- Sections have colored borders when expanded
- Footer stays visible when scrolling
- Escape key closes modal
- Full-screen on mobile

---

## Phase 9: Replace `window.confirm()` with Styled Dialogs

### Goal
Replace native browser confirm dialogs with styled in-app confirmation modals.

### Files to modify
- `src/components/trips/delete-trip-button.tsx`
- `src/components/trips/destination-list.tsx` (for destination delete)
- `src/components/ui/dialog.tsx` (make Dialog functional)

### Instructions

**9.1 — Make Dialog component functional (`dialog.tsx`)**

The current Dialog is a pass-through (does nothing). Rewrite it to be a real modal:

```tsx
'use client';

import { HTMLAttributes, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Keep DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
// but update their styles to match the new design:
export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl',
        className
      )}
      {...props}
    />
  );
}

// DialogHeader, DialogFooter, DialogTitle, DialogDescription stay mostly the same
// but update rounded corners and shadows
```

Remove `DialogTrigger` and `DialogClose` (unused wrappers).

**9.2 — Delete Trip Button with Dialog (`delete-trip-button.tsx`)**

```tsx
'use client';

import { MouseEvent, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DeleteTripButton() {
  const tCommon = useTranslations('common');
  const [showConfirm, setShowConfirm] = useState(false);
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setFormRef(event.currentTarget.closest('form'));
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    formRef?.requestSubmit();
  };

  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        aria-label={tCommon('delete')}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('confirmDelete')}</DialogTitle>
            <DialogDescription>
              {/* Use a more descriptive message */}
              {tCommon('delete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**9.3 — Destination delete in `destination-list.tsx`**

Replace `window.confirm()` in `handleDeleteDestination` with a state-driven dialog:

- Add state: `const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);`
- When delete is clicked: `setPendingDeleteId(destinationId)` instead of `window.confirm()`
- Render a `<Dialog>` at the bottom of the component that shows when `pendingDeleteId !== null`
- On confirm: proceed with the existing delete logic
- On cancel: `setPendingDeleteId(null)`

Add i18n strings for delete confirmation messages:
- `en.json`: `"confirmDeleteDestination": "This destination and all its details will be permanently deleted."`
- `es.json`: `"confirmDeleteDestination": "Este destino y todos sus detalles serán eliminados permanentemente."`

### Verification
- Deleting a trip shows a styled dialog instead of browser confirm
- Deleting a destination shows a styled dialog
- Dialog has Cancel (default) and Delete (red) buttons
- Escape key and backdrop click close the dialog
- Actual deletion only happens on explicit confirm

---

## Phase 10: Share Modal Polish

### Goal
Add entrance animation, visual polish, and better copy feedback.

### File to modify
- `src/components/trips/share-modal.tsx`

### Instructions

**10.1 — Overlay and modal animations**

Same pattern as destination modal:
- Overlay: add `animate-fade-in`
- Modal container: add `animate-scale-in`, update to `rounded-2xl shadow-2xl`

**10.2 — Header with icon**

```tsx
<div className="mb-4">
  <h2 className="flex items-center gap-2 text-lg font-semibold">
    <Share2 className="h-5 w-5 text-primary-500" />
    {tShare('title')}
  </h2>
  <p className="mt-1 text-sm text-slate-500">{tShare('viewOnly')}</p>
</div>
```

Import `Share2` from lucide-react.

**10.3 — URL display**

Style the URL input as a code-like box:
```tsx
<Input
  readOnly
  value={shareUrl}
  className="font-mono text-sm bg-slate-50"
/>
```

**10.4 — Copy button feedback**

Add a brief green flash to the copy button when copied:
```tsx
<Button
  disabled={isPending}
  onClick={handleCopyLink}
  type="button"
  variant="outline"
  className={cn(
    'transition-all duration-200',
    copied && 'border-emerald-400 bg-emerald-50 text-emerald-600'
  )}
>
  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
  <span className="sr-only">{tShare('copyLink')}</span>
</Button>
```

**10.5 — Escape key handling**

Add the same `useEffect` for Escape key as in destination modal.

### Verification
- Share modal fades in with scale animation
- Header has Share icon in primary color
- URL displays in monospace on a subtle background
- Copy button turns green briefly when copied
- Escape key closes the modal

---

## Phase 11: Shared Trip View Polish

### Goal
Make the read-only shared view feel polished with the same visual language.

### File to modify
- `src/components/trips/trip-view-only.tsx`
- `src/messages/en.json` and `src/messages/es.json`

### Instructions

**11.1 — Add i18n strings**

In `en.json` add under `"share"`:
```json
"sharedTrip": "Shared Trip",
"readOnlyBanner": "You are viewing a shared trip (read-only)"
```

Add matching Spanish strings.

**11.2 — Redesign the view**

Add a top banner and use timeline visual:

```tsx
export function TripViewOnly({ locale, trip }: TripViewOnlyProps) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      {/* Read-only banner */}
      <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
        <Eye className="h-4 w-4" />
        {locale === 'es' ? 'Estás viendo un viaje compartido (solo lectura)' : 'You are viewing a shared trip (read-only)'}
      </div>

      {/* Header card with accent bar */}
      <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">
            {locale === 'es' ? 'Viaje compartido' : 'Shared trip'}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{trip.title}</h1>
          {dateRange ? (
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              <Calendar className="h-3.5 w-3.5" />
              {dateRange}
            </span>
          ) : null}
        </div>
      </header>

      {/* Itinerary with timeline */}
      {trip.destinations.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyState}</p>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />
          {trip.destinations.map((destination, index) => (
            <div key={destination.destination_id} className="relative flex gap-4 pb-4">
              <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-300 bg-white text-sm font-bold text-primary-700">
                {index + 1}
              </div>
              <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{destination.city}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {renderDurationLabel(locale, destination.duration)}
                  </span>
                </div>
                {destinationRange ? <p className="mt-1 text-sm text-slate-500">{destinationRange}</p> : null}
                {destination.notes ? <p className="mt-3 text-sm text-slate-700">{destination.notes}</p> : null}
                {destination.budget !== null ? (
                  <p className="mt-2 text-sm text-slate-700">
                    {locale === 'es' ? 'Presupuesto:' : 'Budget:'} ${destination.budget}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

Import `Calendar`, `Eye` from lucide-react.

### Verification
- Shared view shows a teal "read-only" banner at the top
- Header has accent bar, bold title, pill-badge date range
- Destinations display with numbered timeline
- Overall visual language matches the trip editor

---

## Phase 12: Loading States & Feedback

### Goal
Add loading spinners and visual feedback for async operations.

### Files to modify
- Create `src/components/ui/spinner.tsx`
- Update `src/components/trips/destination-list.tsx`
- Update `src/components/trips/import-trip-button.tsx`
- Update `src/components/trips/share-modal.tsx`
- Update `src/components/trips/destination-modal.tsx`

### Instructions

**12.1 — Create Spinner component (`src/components/ui/spinner.tsx`)**

```tsx
import { cn } from '@/lib/utils';

type SpinnerProps = {
  className?: string;
};

export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin text-current', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
```

**12.2 — Use Spinner in pending buttons**

In components that use `isPending`:
- Replace disabled-only feedback with spinner + text:
  ```tsx
  <Button disabled={isPending}>
    {isPending ? <><Spinner className="mr-2" /> Saving...</> : 'Save'}
  </Button>
  ```

Apply this pattern in:
- `destination-modal.tsx` — Save button
- `share-modal.tsx` — Generate link button
- `import-trip-button.tsx` — Import button (already has loadingLabel, add spinner before it)
- `destination-list.tsx` — Add Destination button

**12.3 — Success feedback for copy action**

In `share-modal.tsx`, the copy success already uses emerald text. The Phase 10 changes handle this with the green flash on the copy button.

### Verification
- Buttons show a spinning indicator when operations are pending
- Spinner is properly centered and sized within buttons
- Import button shows spinner during import
- Save button in modal shows spinner during save

---

## Phase 13: Create Trip Page Polish

### Goal
Polish the create trip page to match the new visual language.

### File to modify
- `src/app/[locale]/trips/new/page.tsx`

### Instructions

Update the page to match the new card style and primary button color:

```tsx
export default async function NewTripPage({ params }: NewTripPageProps) {
  const { locale } = params;
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const createTripAction = createTripAndRedirectAction.bind(null, locale);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
        <CardHeader>
          <CardTitle className="text-xl">{tTrips('newTrip')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTripAction} className="flex flex-col gap-4">
            <Input name="title" placeholder={tTrips('defaultTitle')} />
            <div className="flex items-center gap-2">
              <Button type="submit">{tCommon('save')}</Button>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                href={`/${locale}`}
              >
                {tCommon('cancel')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

Key changes:
- Card has accent bar at top
- `rounded-lg` on the cancel link (matching updated button radius)
- Save button automatically uses new primary-600 color from Phase 2

### Verification
- New trip page card has accent bar at top
- Save button is teal
- Page matches the overall new visual language

---

## Phase 14: Final Accessibility Pass

### Goal
Add missing ARIA attributes and keyboard navigation support.

### Files to modify
- `src/components/trips/destination-card.tsx` (menu dropdown)
- `src/components/ui/dialog.tsx` (focus trapping)
- Various icon-only buttons

### Instructions

**14.1 — Dropdown menu ARIA attributes**

In `destination-card.tsx`, the MoreVertical button menu:
```tsx
<button
  aria-label={locale === 'es' ? 'Acciones' : 'Actions'}
  aria-haspopup="true"
  aria-expanded={openMenuId === cardId}
  ...
>

<div
  role="menu"
  className="..."
>
  <button role="menuitem" ...>Edit</button>
  <button role="menuitem" ...>Delete</button>
</div>
```

**14.2 — Dialog focus management**

In `dialog.tsx`, add a `useEffect` to focus the first focusable element when dialog opens, and prevent focus from leaving the dialog:

```tsx
useEffect(() => {
  if (!open) return;

  // Focus the dialog content
  const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
  dialog?.focus();

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = ''; };
}, [open]);
```

Add `role="dialog"` and `aria-modal="true"` to `DialogContent`.

**14.3 — Icon-only button labels**

Ensure all icon-only buttons have `aria-label`:
- Copy button in share modal: `aria-label={tShare('copyLink')}` (already has sr-only span — keep both)
- Export button in trip header: already has text, no change needed
- Drag handle (removed in Phase 7 in favor of timeline numbers — no action needed)

### Verification
- Screen reader announces menu buttons and dialog content correctly
- Focus is trapped inside open dialogs
- Body scroll is disabled when dialogs are open
- All icon-only buttons have accessible labels

---

## Summary of All New/Modified Files

| File | Phase | Action |
|------|-------|--------|
| `tailwind.config.ts` | 1 | Add colors, font |
| `src/app/globals.css` | 1 | Update body, add animations |
| `src/app/layout.tsx` | 1 | Add Inter font |
| `src/lib/utils.ts` | 1 | Use tailwind-merge |
| `src/components/ui/button.tsx` | 2 | New colors, destructive variant |
| `src/components/ui/card.tsx` | 2 | Rounded-xl, transition |
| `src/components/ui/input.tsx` | 2 | Primary focus ring |
| `src/components/ui/textarea.tsx` | 2 | Primary focus ring |
| `src/components/ui/label.tsx` | 2 | Darker text |
| `src/components/ui/select.tsx` | 2 | Primary focus, animation |
| `src/components/ui/dialog.tsx` | 9 | Make functional with animation |
| `src/components/ui/spinner.tsx` | 12 | **New file** |
| `src/components/layout/header.tsx` | 3 | Full redesign |
| `src/components/layout/locale-switcher.tsx` | 3 | Pill toggle |
| `src/app/[locale]/layout.tsx` | 3 | Pass session to Header |
| `src/app/[locale]/(auth)/login/page.tsx` | 4 | Full redesign |
| `src/app/[locale]/page.tsx` | 5 | 2-col grid, empty state |
| `src/components/trips/trip-card.tsx` | 5 | Rich card redesign |
| `src/components/trips/create-trip-button.tsx` | 5 | Primary color, Plus icon |
| `src/components/trips/delete-trip-button.tsx` | 5, 9 | Icon button, styled dialog |
| `src/components/trips/import-trip-button.tsx` | 5, 12 | Spinner |
| `src/components/trips/trip-header.tsx` | 6 | Accent bar, pill badge, hover hint |
| `src/app/[locale]/trips/[tripId]/page.tsx` | 6 | Route indicator |
| `src/components/trips/destination-list.tsx` | 7, 9 | Timeline, styled add form, dialog |
| `src/components/trips/destination-card.tsx` | 7, 14 | Redesign, ARIA |
| `src/components/trips/destination-modal.tsx` | 8 | Animations, close btn, sections |
| `src/components/trips/share-modal.tsx` | 10 | Animation, polish |
| `src/components/trips/trip-view-only.tsx` | 11 | Timeline, banner |
| `src/app/[locale]/trips/new/page.tsx` | 13 | Accent bar |
| `src/messages/en.json` | 4, 5, 9, 11 | New strings |
| `src/messages/es.json` | 4, 5, 9, 11 | New strings |

## Dependencies to Install

```bash
npm install tailwind-merge
```

`Inter` font comes from `next/font/google` (included with Next.js, no install needed).

## Verification (End-to-End)

After all phases are complete:
1. `npm run build` — no build errors
2. `npm run lint` — no lint warnings
3. Manual browser testing at `localhost:5127`:
   - `/es/login` and `/en/login` — login page with gradient, brand, Google button
   - `/es` and `/en` — dashboard with rich cards (or empty state)
   - `/es/trips/new` — create trip with accent bar
   - `/es/trips/:id` — trip editor with timeline, route indicator, polished header
   - Edit destination → modal with animation, close button, colored sections
   - Delete trip/destination → styled confirmation dialog
   - Share trip → modal with animation, monospace URL, green copy flash
   - `/es/share/:id` — read-only view with banner and timeline
4. Test mobile viewport (375px width) — all layouts are responsive
5. Run any existing tests: `npx jest` or `npm test`

---

## Phase 1 Implementation Summary (2026-02-11)

- Added Inter font via `next/font/google` and wired the CSS variable into `font-sans` in `tailwind.config.ts`.
- Defined the primary and accent color palettes in `tailwind.config.ts` for the new design foundation.
- Updated `src/app/globals.css` to use the new base body styles and added reusable animation utilities and keyframes.
- Updated `src/lib/utils.ts` to use `tailwind-merge` for className conflict resolution.
- Attempted `npm install tailwind-merge` but the install failed due to network resolution (`ENOTFOUND registry.npmjs.org`). The dependency is still required for builds to succeed once network access is available.

## Phase 2 Implementation Summary (2026-02-11)

- Updated `Button` variants to use the new primary palette, added the `destructive` variant, and switched base styling to `rounded-lg` with smooth transitions and active scaling.
- Refreshed `Card` styling to `rounded-xl` with a subtle hover-ready shadow transition.
- Updated `Input` and `Textarea` focus rings and borders to `primary-500`, with `rounded-lg` corners to match the new component language.
- Darkened `Label` text for better contrast (`text-slate-700`).
- Aligned `Select` trigger focus styling with inputs, added fade-in animation to the dropdown content, and updated item hover to `primary-50`.
- Build and lint were not run in this session.

## Phase 3 Implementation Summary (2026-02-11)

- Redesigned the header with a sticky, frosted-glass treatment, branded MapPin icon, and highlighted "AI" wordmark accent.
- Added user context to the header with initials fallback and optional profile image rendering.
- Replaced the locale dropdown with a compact ES/EN segmented toggle and preserved locale-aware routing.
- Updated the locale layout to fetch the session server-side and pass user name/image into the header.
- Build and lint were not run in this session.

## Phase 4 Implementation Summary (2026-02-11)

- Redesigned the login page with a primary/accent gradient background, branded icon, and a centered card that animates in on load.
- Added the new auth copy for tagline and welcome-back messaging in both English and Spanish locales.
- Enhanced the Google login button with the inline "G" SVG icon and layout spacing for a more polished CTA.
- Build and lint were not run in this session.

## Phase 5 Implementation Summary (2026-02-11)

- Updated the dashboard to use a two-column grid on large screens and introduced a richer empty state with icon, copy, and CTA.
- Added destination count and total days stats lookup so trip cards can surface richer meta information.
- Redesigned trip cards with an accent bar, icon-based metadata row, and a prominent primary action button.
- Updated the create trip CTA to the primary teal style with a plus icon, and converted delete to a subtle icon-only button.
- Added the new trip i18n strings for empty state and destination counts in both English and Spanish.

## Phase 6 Implementation Summary (2026-02-11)

- Restyled the trip header with an accent gradient bar, rounded container, and a hover underline hint for the editable title field.
- Added a teal pill badge for the trip date range and switched export/share buttons to the smaller outline style.
- Replaced the trip info card with a visual route indicator using plane icons and a dashed connector between departure and return.

## Phase 7 Implementation Summary (2026-02-11)

- Implemented the left-side destination timeline with numbered nodes and a vertical connector line, including drag feedback on the timeline rows.
- Restyled the add-destination form as a dashed timeline endpoint with a plus icon and updated localized placeholders/button labels.
- Redesigned destination cards with rounded-xl styling, hover shadows, inline transport/accommodation icons, and duration pill badges.
- Replaced the divider toggle with a “Show/Hide details” text button and added colored section panels with accent headers for transport, accommodation, notes, and budget.
- Updated the action menu to the new rounded/animated style and added ARIA roles/labels.
- `npm run build` succeeded; ESLint still reports the existing `next/no-img-element` warning in `src/components/layout/header.tsx`.

## Phase 8 Implementation Summary (2026-02-11)

- Added fade/scale entrance animations to the destination modal overlay and container, plus responsive full-screen behavior on small screens.
- Replaced the static header with a dynamic title (including the destination city) and an X close button with proper hover states.
- Restyled the Transport/Accommodation/Additional sections into accordion cards with contextual accent colors and updated toggles.
- Made the footer sticky and visible while the modal content scrolls.
- Added Escape key handling to close the modal when not pending.

## Phase 9 Implementation Summary (2026-02-11)

- Rebuilt the Dialog component to render a real modal with overlay, escape/backdrop dismissal, and updated rounded-2xl styling.
- Replaced the trip delete confirm flow with a styled dialog that submits the form only after explicit confirmation.
- Added a destination delete confirmation dialog in the destination list and wired it to the existing delete action.
- Added destination delete confirmation copy to the English and Spanish locale files.
- `npm run build` succeeded; ESLint still reports the existing `next/no-img-element` warning in `src/components/layout/header.tsx`.

## Phase 10 Implementation Summary (2026-02-12)

- Updated `src/components/trips/share-modal.tsx` with animated entrance behavior: overlay now uses `animate-fade-in` and modal content uses `animate-scale-in` with `rounded-2xl` and `shadow-2xl`.
- Redesigned the modal header to include the `Share2` icon with primary accent color alongside the localized share title, plus softer supporting text styling for the view-only description.
- Restyled the generated URL field as a code-like surface using monospace typography and subtle background (`font-mono`, `text-sm`, `bg-slate-50`) while preserving read-only behavior.
- Added visual copy feedback on the icon-only copy button using `cn()`-merged conditional styles so the button flashes with emerald border/background/text when copy succeeds.
- Added keyboard dismissal via Escape key in a dedicated `useEffect`, respecting pending state (`isPending`) so closing is blocked during in-flight actions.
- Improved accessibility for the icon-only copy action by adding an explicit `aria-label` while keeping the existing screen-reader-only text.
- Verified compilation with `npm run build` on 2026-02-12; build succeeded. Existing unrelated lint warning remains: `@next/next/no-img-element` in `src/components/layout/header.tsx`.

## Phase 11 Implementation Summary (2026-02-12)

- Added the new shared-view copy keys to locale files under `share`: `sharedTrip` and `readOnlyBanner` in both `src/messages/en.json` and `src/messages/es.json`.
- Reworked `src/components/trips/trip-view-only.tsx` to match the refreshed visual language:
  - Added a top read-only banner styled with primary colors and an `Eye` icon.
  - Upgraded the header into a bordered, shadowed card with an accent gradient bar.
  - Styled the shared-trip label as uppercase accent text and preserved a prominent trip title treatment.
  - Replaced plain date text with a primary pill badge that includes a `Calendar` icon.
- Replaced the old itinerary card/list structure with a numbered vertical timeline layout:
  - Added a left connector line and numbered circular nodes for each destination.
  - Rendered each destination inside a rounded card with duration pill, date range, notes, and budget details.
  - Preserved existing date/duration logic and empty-state behavior while improving presentation.
- Verified compilation with `npm run build` on 2026-02-12; build succeeded. Existing unrelated lint warning remains: `@next/next/no-img-element` in `src/components/layout/header.tsx`.

## Phase 12 Implementation Summary (2026-02-12)

- Added a reusable spinner primitive at `src/components/ui/spinner.tsx` with `cn()` support for size/color overrides and a lightweight SVG `animate-spin` implementation.
- Updated pending-state feedback across all required Phase 12 actions:
  - `src/components/trips/destination-modal.tsx`: save button now shows spinner + localized saving label (`Guardando...` / `Saving...`) while pending.
  - `src/components/trips/share-modal.tsx`: generate-link button now shows spinner + localized generating label (`Generando...` / `Generating...`) while pending.
  - `src/components/trips/import-trip-button.tsx`: import button now swaps the upload icon for a spinner while preserving the existing `loadingLabel` text.
  - `src/components/trips/destination-list.tsx`: add-destination button now shows spinner + localized adding label (`Agregando...` / `Adding...`) while pending.
- Kept copy-success feedback in `share-modal.tsx` unchanged (emerald success state from Phase 10), as specified in Phase 12 instructions.
- Verification on 2026-02-12:
  - `npm run build` succeeded.
  - `npm run lint` completed with the pre-existing warning only: `@next/next/no-img-element` in `src/components/layout/header.tsx`.

## Phase 13 Implementation Summary (2026-02-12)

- Updated `src/app/[locale]/trips/new/page.tsx` to align the create trip surface with the refreshed visual language from prior phases.
- Added the accent gradient bar at the top of the create-trip card (`from-primary-400` to `to-primary-600`) and set the card container to `overflow-hidden` so the bar clips cleanly with rounded corners.
- Increased heading prominence by applying `text-xl` to the new-trip card title.
- Updated the cancel link styling from `rounded-md` to `rounded-lg` to match the button radius standard introduced in Phase 2 while preserving existing behavior and route target.
- Kept the implementation intentionally scoped to Phase 13 only; no unrelated refactors were introduced.
- Verification on 2026-02-12:
  - `npm run build` succeeded.
  - `npm run lint` succeeded with the pre-existing warning only: `@next/next/no-img-element` in `src/components/layout/header.tsx`.

## Phase 14 Implementation Summary (2026-02-12)

- Updated `src/components/trips/destination-card.tsx` menu trigger semantics for better assistive-tech support:
  - Added `aria-haspopup="true"` to the actions trigger.
  - Added dynamic `aria-controls` wiring from trigger to menu container.
  - Kept `aria-expanded`, `role="menu"`, and `role="menuitem"` behaviors aligned with current open/close state.
- Improved icon accessibility in `destination-card` by marking decorative transport/accommodation status icons as `aria-hidden`, preventing redundant screen reader output.
- Implemented dialog focus management in `src/components/ui/dialog.tsx`:
  - Added open-state focus placement to the first focusable control (fallback to dialog container).
  - Added keyboard focus trapping for `Tab` and `Shift+Tab` so focus cannot escape while the dialog is open.
  - Preserved and restored the previously focused element when the dialog closes.
  - Locked body scroll while dialogs are open and restored original overflow on close.
- Added explicit dialog semantics on `DialogContent`:
  - `role="dialog"`
  - `aria-modal="true"`
  - `tabIndex={-1}` to support programmatic focus.
- Accessibility verification outcomes on 2026-02-12:
  - `npm run lint` completed successfully with the existing unrelated warning only: `@next/next/no-img-element` in `src/components/layout/header.tsx`.
  - `npm run build` could not be fully validated because the local optional SWC binary was unavailable (`@next/swc-darwin-arm64`), and Next.js failed with `Failed to load SWC binary for darwin/arm64` (same result in both sandboxed and elevated runs).
  - Additional compile attempt via `npx tsc --noEmit` surfaced pre-existing missing test dependencies (`vitest`, `@testing-library/react`) unrelated to Phase 14 changes.
