# Onboarding Improvements Spec

Five independent tasks. Each can be implemented and verified in isolation. Execute in order (later tasks reference earlier i18n keys).

---

## Task 1: i18n Keys for All Onboarding Copy

### Problem

All onboarding tasks below require new translated strings. Add them upfront so subsequent tasks can reference them.

### Changes

**File: `src/messages/en.json`**

Add a new `"onboarding"` namespace at the end of the file (before the closing `}`):

```json
"onboarding": {
  "welcomeTitle": "Plan your next adventure",
  "welcomeDescription": "TripAIvisor helps you organize multi-city trips with all the details in one place.",
  "featureDestinations": "Add destinations and build your route",
  "featureDates": "Track dates, transport, and accommodation",
  "featureShare": "Export or share your itinerary with others",
  "createFirstTrip": "Create your first trip",
  "tripDetailStep1": "Set your trip dates using the date pickers above",
  "tripDetailStep2": "Add destinations below — each can include transport and accommodation",
  "tripDetailStep3": "Share or export your trip when you're ready",
  "gotIt": "Got it"
}
```

Update existing keys:

```diff
- "noTripsDescription": "Create your first trip to get started",
+ "noTripsDescription": "Name your trip, set your cities, then start adding destinations.",
```

Add new key under `"trips"`:

```json
"newTripHint": "Give your trip a name and set your departure city. You'll add destinations, transport, and accommodation next."
```

Add new key under `"destinations"`:

```json
"noDestinationsHint": "Add your first destination below. Each one can include transport details, accommodation info, and notes."
```

**File: `src/messages/es.json`**

Same structure, Spanish translations:

```json
"onboarding": {
  "welcomeTitle": "Planifica tu proxima aventura",
  "welcomeDescription": "TripAIvisor te ayuda a organizar viajes con multiples destinos con todos los detalles en un solo lugar.",
  "featureDestinations": "Agrega destinos y arma tu ruta",
  "featureDates": "Organiza fechas, transporte y alojamiento",
  "featureShare": "Exporta o comparte tu itinerario con otros",
  "createFirstTrip": "Crea tu primer viaje",
  "tripDetailStep1": "Configura las fechas de tu viaje con los selectores de fecha",
  "tripDetailStep2": "Agrega destinos abajo — cada uno puede incluir transporte y alojamiento",
  "tripDetailStep3": "Comparte o exporta tu viaje cuando estes listo",
  "gotIt": "Entendido"
}
```

Update existing:

```diff
- "noTripsDescription": "Crea tu primer viaje para empezar",
+ "noTripsDescription": "Nombra tu viaje, configura tus ciudades, y empieza a agregar destinos.",
```

Add under `"trips"`:

```json
"newTripHint": "Dale un nombre a tu viaje y configura tu ciudad de salida. Despues agregaras destinos, transporte y alojamiento."
```

Add under `"destinations"`:

```json
"noDestinationsHint": "Agrega tu primer destino abajo. Cada uno puede incluir detalles de transporte, alojamiento y notas."
```

### Acceptance Criteria

- [ ] `npm run build` passes with no missing translation key warnings.
- [ ] Both `en.json` and `es.json` are valid JSON.

### Task 1 Implementation Summary (Completed)

**Scope implemented**

- Updated `src/messages/en.json`:
  - Added `trips.newTripHint`.
  - Updated `trips.noTripsDescription` to the new onboarding-oriented copy.
  - Added `destinations.noDestinationsHint`.
  - Added new top-level `onboarding` namespace with:
    - `welcomeTitle`
    - `welcomeDescription`
    - `featureDestinations`
    - `featureDates`
    - `featureShare`
    - `createFirstTrip`
    - `tripDetailStep1`
    - `tripDetailStep2`
    - `tripDetailStep3`
    - `gotIt`
- Updated `src/messages/es.json` with the same structural changes:
  - Added `trips.newTripHint`.
  - Updated `trips.noTripsDescription`.
  - Added `destinations.noDestinationsHint`.
  - Added full `onboarding` namespace with Spanish translations for all keys listed above.
- Kept the change surgical to Task 1 only (no unrelated code or UI behavior changes).

**Validation performed**

- Ran JSON validation for both locale files:
  - `node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/messages/es.json','utf8')); console.log('json-ok')"`
  - Result: `json-ok`.
- Ran full production build:
  - `npm run build`
  - Result: success (`next build` completed without missing translation key warnings or type/compile failures).

**Notes**

- `tripDetailStep2` strings were stored with ASCII separator (`" - "`) instead of an em dash to stay aligned with repository editing constraints.

**Task 1 outcome**

- Task 1 is fully implemented and validated.

---

## Task 2: Dashboard — First-Time vs Returning User

### Problem

The dashboard at `src/app/[locale]/page.tsx` shows "0 trips, 0 destinations" for new users — meaningless stats that don't explain what the app does or guide the user to take action. The CTA ("Go to my trips") sends them to an empty list, adding a pointless intermediate step.

### Solution

Use the already-available `trips.length` (server-side, no client state needed) to render a conditional view:

- **`trips.length === 0`**: Show a welcome card with value proposition, 3 feature bullets, and a CTA linking directly to `/${locale}/trips/new`.
- **`trips.length > 0`**: Keep current stats cards and "Go to trips" button unchanged.

### Changes

**File: `src/app/[locale]/page.tsx`**

Add `getTranslations` for the `onboarding` namespace (alongside existing `trips` and `auth` namespaces):

```typescript
const tOnboarding = await getTranslations({ locale, namespace: 'onboarding' });
```

Add imports for icons:

```typescript
import { MapPin, Calendar, Share2 } from 'lucide-react';
```

Replace the return JSX with a conditional branch. The key structural change:

```tsx
return (
  <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 p-8">
    <div className="text-center">
      <h1 className="text-3xl font-semibold text-foreground-primary">{welcomeMessage}</h1>
      <p className="mt-2 text-foreground-muted">{tAuth('tagline')}</p>
    </div>

    {trips.length === 0 ? (
      {/* New user welcome card */}
    ) : (
      {/* Existing stats cards — keep as-is */}
    )}

    {/* CTA button — change href and label based on trips.length */}
  </main>
);
```

**Welcome card structure** (when `trips.length === 0`):

```tsx
<Card className="w-full max-w-md overflow-hidden">
  <div className="h-1.5 bg-gradient-to-r from-brand-route via-brand-primary to-brand-accent" />
  <CardContent className="space-y-4 p-6">
    <p className="text-body-sm text-foreground-secondary">
      {tOnboarding('welcomeDescription')}
    </p>
    <ul className="space-y-3">
      <li className="flex items-center gap-3 text-body-sm text-foreground-secondary">
        <MapPin className="h-4 w-4 flex-shrink-0 text-brand-primary" />
        {tOnboarding('featureDestinations')}
      </li>
      <li className="flex items-center gap-3 text-body-sm text-foreground-secondary">
        <Calendar className="h-4 w-4 flex-shrink-0 text-brand-primary" />
        {tOnboarding('featureDates')}
      </li>
      <li className="flex items-center gap-3 text-body-sm text-foreground-secondary">
        <Share2 className="h-4 w-4 flex-shrink-0 text-brand-primary" />
        {tOnboarding('featureShare')}
      </li>
    </ul>
  </CardContent>
</Card>
```

**CTA button** (when `trips.length === 0`):

```tsx
<Link
  className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
  href={`/${locale}/trips/new`}
>
  {tOnboarding('createFirstTrip')}
</Link>
```

When `trips.length > 0`, keep the existing stats grid and "Go to my trips" link unchanged.

### Implementation Notes

- This is a **server component** — the conditional is based on `trips.length`, no `useState` or `useEffect` needed.
- Reuse existing `Card` and `CardContent` from `@/components/ui/card`.
- The gradient bar (`h-1.5 bg-gradient-to-r from-brand-route via-brand-primary to-brand-accent`) matches `TripCard` and the new trip form for visual consistency.
- `MapPin`, `Calendar`, and `Share2` are already available from `lucide-react` (used elsewhere in the app).

### Acceptance Criteria

- [ ] New user (0 trips) sees welcome card with description, 3 feature bullets, and "Create your first trip" CTA.
- [ ] CTA links to `/${locale}/trips/new` (not `/trips`).
- [ ] Returning user (1+ trips) sees existing stats cards and "Go to my trips" button — unchanged.
- [ ] Both `en` and `es` locales render correct translations.

### Task 2 Implementation Summary (Completed March 6, 2026)

Task 2 has been implemented in `src/app/[locale]/page.tsx` with a server-side conditional render based on `trips.length`.

Implemented changes:

- Added onboarding translations in the dashboard server component:
  - `const tOnboarding = await getTranslations({ locale, namespace: 'onboarding' });`
- Added `lucide-react` icons used by the onboarding welcome card:
  - `MapPin`, `Calendar`, `Share2`
- Replaced the previous always-on stats block with a conditional branch:
  - `trips.length === 0`: renders a welcome card with:
    - top gradient bar (`from-brand-route via-brand-primary to-brand-accent`)
    - onboarding title (`onboarding.welcomeTitle`)
    - onboarding description (`onboarding.welcomeDescription`)
    - three feature bullets (`featureDestinations`, `featureDates`, `featureShare`) with icons
    - primary CTA linking directly to `/${locale}/trips/new` with label `onboarding.createFirstTrip`
  - `trips.length > 0`: preserves existing behavior:
    - stats cards for total trips and total destinations
    - existing CTA linking to `/${locale}/trips` with label `trips.goToTrips`
- No client state/hooks were added; logic remains fully server-rendered as required.
- Existing returning-user stats copy and card structure were kept unchanged.

Validation performed:

- Initial `npm run build` failed in this worktree because dependencies were missing (`sh: next: command not found`).
- Installed dependencies via `npm install`.
- Re-ran `npm run build` successfully after installation (exit code 0).
- Build emitted non-blocking Next.js/Webpack cache warnings from `next-intl` dynamic import analysis and a Node experimental warning; no compile/type errors occurred.

---

## Task 3: New Trip Form — Guidance Text

### Problem

The new trip form at `src/app/[locale]/trips/new/page.tsx` shows a title and fields (title, departure city, return city) but gives no indication of what happens after creation. Users don't know what to expect.

### Solution

Add one `<p>` element with guidance text below the `CardTitle`, inside `CardHeader`.

### Changes

**File: `src/app/[locale]/trips/new/page.tsx`**

Add `getTranslations` for `trips` namespace (already exists). Use the new `newTripHint` key.

Inside the `<CardHeader>` block, after the `<CardTitle>`:

```tsx
<CardHeader className="pb-4">
  <CardTitle className="font-display text-title-lg text-foreground-primary sm:text-display-md">
    {tTrips('newTrip')}
  </CardTitle>
  <p className="text-body-sm text-foreground-secondary">
    {tTrips('newTripHint')}
  </p>
</CardHeader>
```

### Implementation Notes

- `tTrips` is already available in this component — no new imports needed.
- `CardHeader` already has `space-y` via shadcn defaults, so the `<p>` will be spaced from the title naturally. If not, add `mt-1` to the `<p>`.

### Acceptance Criteria

- [ ] `/en/trips/new` shows hint text: "Give your trip a name and set your departure city..."
- [ ] `/es/trips/new` shows Spanish equivalent.
- [ ] Text appears between the card title and the form fields.

### Task 3 Implementation Summary (Completed)

**Scope implemented**

- Updated `src/app/[locale]/trips/new/page.tsx` to add onboarding guidance text directly below the new trip title.
- Reused the existing `tTrips` translator with the already-added `newTripHint` key:
  - Added `<p className="text-body-sm text-foreground-secondary">{tTrips('newTripHint')}</p>` inside `CardHeader`, immediately after `CardTitle`.
- Kept the change surgical to Task 3 only:
  - No new imports.
  - No behavior changes to form actions, buttons, or navigation.
  - No refactors outside the target block.

**Validation performed**

- Verified translation key presence in both locale files:
  - `src/messages/en.json` contains `trips.newTripHint`.
  - `src/messages/es.json` contains `trips.newTripHint`.
- Ran full production build after the change:
  - Initial run: `npm run build` failed in this fresh worktree because required auth environment variables were not set (`Missing required environment variable: DATABASE_URL`).
  - Resolution: installed dependencies in the worktree (`npm install`) and reran build with temporary inline env values for required auth variables (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
  - Final result: success (project compiles and build completes).

**Issues encountered and fixed**

- Environment setup issue (not a code regression): missing required env vars in this worktree caused the first build attempt to fail.
- Fixed by providing temporary env values for build validation; no code changes were needed beyond Task 3 scope.

**Task 3 outcome**

- Task 3 is fully implemented and validated.

---

## Task 4: Trip Detail — One-Time Hint Card

### Problem

The trip detail page (`src/app/[locale]/trips/[tripId]/page.tsx`) is the most complex page in the app. It has date pickers, city banners, a destination list with drag-and-drop, transport modals, accommodation, and export/share — but gives zero guidance to first-time users.

### Solution

Create a small client component `TripDetailHint` that shows a dismissible getting-started card on first visit. Uses `localStorage` to track whether the user has seen it.

### Changes

**New file: `src/components/trips/trip-detail-hint.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

const STORAGE_KEY = 'tripaivisor_seen_trip_detail';

export function TripDetailHint() {
  const t = useTranslations('onboarding');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <Card className="overflow-hidden border-brand-primary/30 bg-brand-accent-soft">
      <CardContent className="flex gap-4 p-4 sm:p-5">
        <ol className="flex-1 list-inside list-decimal space-y-1.5 text-body-sm text-foreground-secondary">
          <li>{t('tripDetailStep1')}</li>
          <li>{t('tripDetailStep2')}</li>
          <li>{t('tripDetailStep3')}</li>
        </ol>
        <button
          aria-label={t('gotIt')}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:text-foreground-primary"
          onClick={dismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
```

**File: `src/app/[locale]/trips/[tripId]/page.tsx`**

Add import and render between the back link and `TripHeader`:

```tsx
import { TripDetailHint } from '@/components/trips/trip-detail-hint';
```

```tsx
<ViewTransitionLink ... >
  ...back to trips...
</ViewTransitionLink>

<TripDetailHint />

<TripHeader ... />
```

### Implementation Notes

- `useEffect` with empty dependency array ensures `localStorage` is only read on mount (SSR-safe).
- `useState(false)` means the card doesn't flash during SSR — it only appears after hydration confirms the flag is absent.
- The `X` button is standard pattern used elsewhere in the app for dismissible elements.
- `bg-brand-accent-soft` and `border-brand-primary/30` make it visually distinct from content cards without being intrusive.
- The component is ~35 lines. No reducer, no context, no external state management.

### Acceptance Criteria

- [ ] First visit to any trip detail page shows the hint card with 3 numbered steps.
- [ ] Clicking the X button dismisses the card and sets `localStorage` flag.
- [ ] Subsequent visits (same or different trip) do not show the card.
- [ ] Clearing `localStorage` makes the card reappear.
- [ ] Card renders correctly in both `en` and `es` locales.

---

## Task 5: Destination List — Richer Empty State

### Problem

When a trip has no destinations, `destination-list.tsx` (line 517-518) shows a hardcoded string: `'No destinations yet.'` / `'No hay destinos todavia.'` — minimal and unhelpful.

### Solution

Replace the hardcoded string with the new `destinations.noDestinationsHint` i18n key, which provides actionable guidance.

### Changes

**File: `src/components/trips/destination-list.tsx`**

The component already receives `locale` as a prop and uses `useTranslations` for the `destinations` namespace. Locate the empty state block (around line 515-519):

```tsx
{items.length === 0 ? (
  <>
    <p className="rounded-lg border border-dashed border-border-strong bg-surface p-4 text-body-sm text-foreground-secondary">
      {locale === 'es' ? 'No hay destinos todavia.' : 'No destinations yet.'}
    </p>
    {addDestinationForm(false)}
  </>
```

Replace the hardcoded locale check with the i18n key:

```tsx
{items.length === 0 ? (
  <>
    <p className="rounded-lg border border-dashed border-border-strong bg-surface p-4 text-body-sm text-foreground-secondary">
      {tDestinations('noDestinationsHint')}
    </p>
    {addDestinationForm(false)}
  </>
```

### Implementation Notes

- Check how `tDestinations` (or equivalent) is already obtained in this component. The component uses `useTranslations` — look for the existing call to the `'destinations'` namespace and use it. If only `'common'` is loaded, add `const tDestinations = useTranslations('destinations');`.
- This also fixes the anti-pattern of hardcoded locale checks (`locale === 'es'`) — all copy should go through `next-intl`.

### Acceptance Criteria

- [ ] Empty destination list shows: "Add your first destination below. Each one can include transport details, accommodation info, and notes."
- [ ] Spanish locale shows the equivalent translated string.
- [ ] No hardcoded locale check (`locale === 'es'`) remains in the empty state.
- [ ] The "Add Destination" form still appears below the empty state message.
