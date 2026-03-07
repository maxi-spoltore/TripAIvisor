# Distill Spec: Remove Visual Complexity from Dashboard & Trip Editor

## Context

TripAIvisor has a "cards-in-cards" problem: bordered containers nested inside bordered cards throughout the trip editor. The dashboard page is a dead-end that adds an unnecessary click before reaching the trips list. This spec strips decorative weight and flattens visual nesting while preserving all functionality.

**Audience**: Couples/small groups, one person manages the plan
**Core goals**: Planning new trips + referencing existing trip details (equally important)
**User-identified pain points**: Dashboard page (unnecessary), Trip editor (too heavy)

---

## 1. Eliminate Dashboard -- Redirect to Trips List

### File: `src/app/[locale]/page.tsx`

**Current state** (83 lines): Fetches user session, trips, and destination stats. Renders a welcome message, two stat cards (total trips, total destinations), and a "Go to Trips" link.

**Change**: Replace the entire rendered output with a redirect. Keep the auth guard.

```tsx
// BEFORE (lines 30-82)
export default async function LocaleDashboardPage({ params }: DashboardPageProps) {
  const { locale } = params;
  const tTrips = await getTranslations({ locale, namespace: 'trips' });
  const tAuth = await getTranslations({ locale, namespace: 'auth' });
  const session = (await auth.api.getSession({ headers: new Headers(headers()) })) as SessionUser | null;
  const userId = parseUserId(session);
  if (!userId) {
    redirect(`/${locale}/login`);
  }
  const trips = await getUserTrips(userId);
  const tripStats = await getTripDestinationStats(trips.map((trip) => trip.trip_id));
  // ... renders welcome, stats, link
}

// AFTER
export default async function LocaleDashboardPage({ params }: DashboardPageProps) {
  const { locale } = params;
  const session = (await auth.api.getSession({ headers: new Headers(headers()) })) as SessionUser | null;
  const userId = parseUserId(session);
  if (!userId) {
    redirect(`/${locale}/login`);
  }
  redirect(`/${locale}/trips`);
}
```

**Remove unused imports**: `Link`, `Card`, `CardContent`, `getTranslations`, `getTripDestinationStats`, `getUserTrips`.

### File: `src/components/layout/header.tsx`

**Change**: Update logo href from `/${locale}` to `/${locale}/trips` (line 16) to avoid a redirect chain.

```tsx
// BEFORE
<Link href={`/${locale}`} ...>

// AFTER
<Link href={`/${locale}/trips`} ...>
```

---

## 2. Flatten Trip Header

### File: `src/components/trips/trip-header.tsx`

### 2a. Remove gradient top bar

**Line 162**: Delete the gradient bar div.

```tsx
// DELETE this line:
<div className="h-1.5 bg-gradient-to-r from-brand-route via-brand-primary to-brand-accent" />
```

### 2b. Remove "Trip summary" label

**Lines 166-168**: Delete the label paragraph.

```tsx
// DELETE these lines:
<p className="text-label-sm uppercase tracking-[0.03em] text-foreground-muted">
  {locale === 'es' ? 'Resumen del viaje' : 'Trip summary'}
</p>
```

### 2c. Remove nested date container

**Lines 185-223**: Remove the bordered wrapper around the date section. Keep the inner content.

```tsx
// BEFORE (line 185)
<div className="space-y-3 rounded-lg border border-border bg-elevated p-3 sm:p-4">
  <div className="grid gap-3 sm:grid-cols-2">
    {/* date pickers */}
  </div>
  {/* days badge */}
  {/* date error */}
</div>

// AFTER - remove the outer bordered div, keep inner content as direct children
<div className="grid gap-3 sm:grid-cols-2">
  {/* date pickers - unchanged */}
</div>
{totalDays > 0 ? (
  <span className="inline-flex w-fit rounded-pill bg-brand-accent-soft px-3 py-1 text-label-md font-semibold text-brand-primary">
    {tTrips('days', { count: totalDays })}
  </span>
) : null}
{dateError ? <p className="text-body-sm text-danger">{dateError}</p> : null}
```

### 2d. Move Export/Share inline with title

**Lines 225-234**: Replace the two-button grid with inline icon buttons positioned in the title row.

```tsx
// BEFORE - title and buttons are separate sections
<div className="group relative space-y-2">
  {/* title input */}
</div>
{/* ... dates ... */}
<div className="grid gap-2 sm:grid-cols-2">
  <Button className="w-full sm:w-auto" onClick={handleExportTrip} size="sm" variant="outline">
    <Download aria-hidden="true" className="mr-2 h-4 w-4" />
    {tTrips('export')}
  </Button>
  <Button className="w-full sm:w-auto" onClick={() => setIsShareModalOpen(true)} size="sm" variant="outline">
    <Share2 aria-hidden="true" className="mr-2 h-4 w-4" />
    {tShare('open')}
  </Button>
</div>

// AFTER - buttons move into the title row, icon-only
<div className="group relative flex items-start gap-3">
  <div className="min-w-0 flex-1 space-y-2">
    {/* title input - unchanged */}
  </div>
  <div className="flex shrink-0 gap-1">
    <Button
      aria-label={tTrips('export')}
      onClick={handleExportTrip}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Download aria-hidden="true" className="h-4 w-4" />
    </Button>
    <Button
      aria-label={tShare('open')}
      onClick={() => setIsShareModalOpen(true)}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Share2 aria-hidden="true" className="h-4 w-4" />
    </Button>
  </div>
</div>
```

---

## 3. Flatten Trip City Banner

### File: `src/components/trips/trip-city-banner.tsx`

### 3a. Remove outer card wrapper

**Line 78**: Remove the card wrapper.

```tsx
// BEFORE
<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">

// AFTER - no wrapper, the grid is the root element
<div className="grid gap-3 sm:items-center md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
```

### 3b. Remove inner bordered boxes

**Lines 80 and 131**: Remove the bordered containers around departure and return sections.

```tsx
// BEFORE (departure, line 80)
<div className="space-y-1 rounded-lg border border-border bg-elevated px-3 py-2">
  <span className="text-label-sm ...">{tTrips('departureCity')}</span>
  <div className="flex items-center gap-2 ...">
    {/* icon + editable city */}
  </div>
</div>

// AFTER - keep spacing and label, remove border/bg
<div className="space-y-1">
  <span className="text-label-sm uppercase tracking-[0.03em] text-foreground-muted">{tTrips('departureCity')}</span>
  <div className="flex items-center gap-2 text-body-md font-semibold text-foreground-primary">
    {/* icon + editable city - unchanged */}
  </div>
</div>
```

Apply the same change to the return section (line 131).

---

## 4. Simplify Destination Cards (Highest Impact)

### File: `src/components/trips/destination-card.tsx`

### 4a. Flatten collapsed preview

**Lines 333-353**: Replace bordered containers with simple icon-prefixed lines.

```tsx
// BEFORE
{!expanded ? (
  <div className="space-y-2 text-body-sm text-foreground-secondary">
    {transportPreview.length > 0 ? (
      <div className="space-y-1 rounded-lg border border-border bg-elevated p-3">
        {transportPreview.map((field) => (
          <p key={`transport-${field.label}`}>
            <span className="text-foreground-muted">{field.label}:</span> {field.value}
          </p>
        ))}
      </div>
    ) : null}
    {accommodationPreview.length > 0 && !destination.is_stopover ? (
      <div className="space-y-1 rounded-lg border border-border bg-elevated p-3">
        {accommodationPreview.map((field) => (
          <p key={`accommodation-${field.label}`}>
            <span className="text-foreground-muted">{field.label}:</span> {field.value}
          </p>
        ))}
      </div>
    ) : null}
  </div>
) : null}

// AFTER
{!expanded ? (
  <div className="space-y-1.5 text-body-sm text-foreground-secondary">
    {transportPreview.length > 0 ? (
      <p className="flex items-center gap-2">
        <TransportIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-route" />
        <span>{transportPreview.map((f) => f.value).join(' · ')}</span>
      </p>
    ) : null}
    {accommodationPreview.length > 0 && !destination.is_stopover ? (
      <p className="flex items-center gap-2">
        <Hotel aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
        <span>{accommodationPreview.map((f) => f.value).join(' · ')}</span>
      </p>
    ) : null}
  </div>
) : null}
```

### 4b. Flatten expanded view

**Lines 373-427**: Replace bordered boxes with divider-separated sections.

```tsx
// BEFORE - each section wrapped in rounded-lg border border-border bg-elevated p-3
{expanded ? (
  <div className="space-y-3">
    {transportDetails.length > 0 ? (
      <div className="rounded-lg border border-border bg-elevated p-3">
        <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-brand-primary">
          <TransportIcon aria-hidden="true" className="h-4 w-4" />
          {locale === 'es' ? 'Transporte' : 'Transport'}
        </h4>
        <div className="space-y-1 text-body-sm text-foreground-secondary">
          {transportDetails.map((field) => (
            <p key={`expanded-transport-${field.label}`}>
              <span className="text-foreground-muted">{field.label}:</span> {field.value}
            </p>
          ))}
        </div>
      </div>
    ) : null}
    {/* Same pattern for accommodation, notes, budget */}
  </div>
) : null}

// AFTER - flat sections with top dividers
{expanded ? (
  <div className="space-y-3">
    {transportDetails.length > 0 ? (
      <div className="border-t border-border pt-3">
        <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-brand-primary">
          <TransportIcon aria-hidden="true" className="h-4 w-4" />
          {locale === 'es' ? 'Transporte' : 'Transport'}
        </h4>
        <div className="space-y-1 text-body-sm text-foreground-secondary">
          {transportDetails.map((field) => (
            <p key={`expanded-transport-${field.label}`}>
              <span className="text-foreground-muted">{field.label}:</span> {field.value}
            </p>
          ))}
        </div>
      </div>
    ) : null}

    {accommodationDetails.length > 0 && !destination.is_stopover ? (
      <div className="border-t border-border pt-3">
        <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-brand-accent">
          <Hotel aria-hidden="true" className="h-4 w-4" />
          {locale === 'es' ? 'Hospedaje' : 'Accommodation'}
        </h4>
        <div className="space-y-1 text-body-sm text-foreground-secondary">
          {accommodationDetails.map((field) => (
            <p key={`expanded-accommodation-${field.label}`}>
              <span className="text-foreground-muted">{field.label}:</span> {field.value}
            </p>
          ))}
        </div>
      </div>
    ) : null}

    {destination.notes ? (
      <div className="border-t border-border pt-3">
        <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-foreground-primary">
          <StickyNote aria-hidden="true" className="h-4 w-4" />
          {locale === 'es' ? 'Notas' : 'Notes'}
        </h4>
        <p className="text-body-sm text-foreground-secondary">{destination.notes}</p>
      </div>
    ) : null}

    {destination.budget !== null ? (
      <div className="border-t border-border pt-3">
        <h4 className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-success">
          <DollarSign aria-hidden="true" className="h-4 w-4" />
          {locale === 'es' ? 'Presupuesto' : 'Budget'}
        </h4>
        <p className="text-body-sm text-foreground-secondary">${destination.budget}</p>
      </div>
    ) : null}
  </div>
) : null}
```

---

## 5. Simplify Departure & Return Cards

### File: `src/components/trips/departure-card.tsx`

### 5a. Remove gradient background

**Line 250**:

```tsx
// BEFORE
<div className="rounded-xl border border-border bg-gradient-to-r from-subtle to-surface shadow-sm">

// AFTER
<div className="rounded-xl border border-border bg-surface shadow-card">
```

### 5b. Remove inner transport container

**Line 269**: Replace the bordered container with a top divider.

```tsx
// BEFORE
{hasTransport ? (
  <div className="mt-4 rounded-lg bg-elevated p-3">
    {/* transport content */}
  </div>
) : null}

// AFTER
{hasTransport ? (
  <div className="mt-4 border-t border-border pt-4">
    {/* transport content - unchanged */}
  </div>
) : null}
```

### File: `src/components/trips/return-card.tsx`

Apply the same two changes (remove gradient bg, replace inner container with divider). The return card mirrors departure card structure.

---

## 6. Remove Settings Placeholder from User Menu

### File: `src/components/layout/user-menu.tsx`

**Lines 268-272**: Delete the disabled "Settings (coming soon)" menu item.

```tsx
// DELETE these lines:
<div className="flex cursor-not-allowed items-center gap-2 px-4 py-2 text-body-sm text-foreground-muted">
  <Settings aria-hidden="true" className="h-4 w-4" />
  <span>{tAuth('settings')}</span>
  <span className="text-label-sm">({tAuth('comingSoon')})</span>
</div>
```

Also remove the `Settings` import from the lucide-react import line (line 4) since it becomes unused.

---

## What's NOT Changing

- All functionality preserved (editing, drag-to-reorder, modals, share, export, import)
- TripCard gradient bar in the trips list stays (appropriate accent for cards in a grid)
- Timeline vertical line and node circles stay
- No code deduplication (transport utility duplication across files is out of scope)
- Add destination form stays as-is
- Delete confirmation dialog stays as-is

---

## Summary of Removed Visual Patterns

| Pattern | Occurrences | After |
|---------|-------------|-------|
| Nested `rounded-lg border bg-elevated` inside cards | ~11 across 5 files | 0 (replaced with dividers/spacing) |
| Decorative gradient bars in editor | 2 (trip header, departure/return) | 0 |
| Gradient card backgrounds | 2 (departure + return) | 0 |
| Dashboard dead-end page | 1 | Redirect |
| Placeholder menu items | 1 | Removed |

---

## Verification

1. Navigate to `/` -- should redirect to `/[locale]/trips`
2. Logo click from any page goes to `/[locale]/trips`
3. Trip editor: title editable, dates inline (no bordered box), Export/Share accessible as icon buttons
4. City banner: departure/return cities editable, persist on blur, no bordered boxes
5. Destination cards: collapsed shows transport/accommodation as icon-prefixed text, expanded shows sections with dividers not boxes
6. Departure/return cards: no gradient bg, transport details visible with divider, multi-leg itinerary works, edit modal opens
7. User menu: no "Settings" placeholder, language/theme/sign-out all work
8. Run `npm run build` to verify no compile errors

---

## Implementation Summary (Completed March 7, 2026)

### Completed Phase 1 -- Eliminate Dashboard

- Updated `src/app/[locale]/page.tsx` to preserve the auth guard and immediately redirect authenticated users to `/${locale}/trips`.
- Removed now-unused dashboard imports and data-fetch logic (`Link`, translation calls, trip stats queries, card rendering).
- Updated header logo target in `src/components/layout/header.tsx` from `/${locale}` to `/${locale}/trips` to avoid redirect chaining.

### Completed Phase 2 -- Flatten Trip Header

- In `src/components/trips/trip-header.tsx`:
  - Removed the decorative gradient top bar.
  - Removed the "Trip summary" label.
  - Removed the nested bordered date wrapper; date grid, days badge, and date error remain intact and functional.
  - Moved Export/Share actions inline with the title row as icon-only ghost buttons with `aria-label` values for accessibility.
  - Removed the old separate two-button grid section.

### Completed Phase 3 -- Flatten Trip City Banner

- In `src/components/trips/trip-city-banner.tsx`:
  - Removed the outer card wrapper (`rounded-xl border bg-surface p-* shadow-*`).
  - Removed inner bordered/elevated wrappers around departure and return city blocks.
  - Kept existing editable city behavior, blur persistence, and keyboard interactions unchanged.

### Completed Phase 4 -- Simplify Destination Cards

- In `src/components/trips/destination-card.tsx`:
  - Collapsed preview now renders compact icon-prefixed text lines for transport and accommodation values instead of nested bordered boxes.
  - Expanded detail sections (transport, accommodation, notes, budget) now use `border-t + pt-*` separators instead of `rounded-lg border bg-elevated` containers.
  - Existing expand/collapse behavior and content logic remain unchanged.

### Completed Phase 5 -- Simplify Departure & Return Cards

- In `src/components/trips/departure-card.tsx` and `src/components/trips/return-card.tsx`:
  - Replaced gradient backgrounds with flat `bg-surface` cards and `shadow-card`.
  - Replaced inner transport block container (`rounded-lg bg-elevated p-3`) with top-divider layout (`border-t border-border pt-4`).
  - Multi-leg itinerary rendering and edit modal flows were preserved.

### Completed Phase 6 -- Remove Settings Placeholder

- In `src/components/layout/user-menu.tsx`:
  - Removed the disabled "Settings (coming soon)" menu row.
  - Removed the now-unused `Settings` icon import from `lucide-react`.

### Files Updated

- `src/app/[locale]/page.tsx`
- `src/components/layout/header.tsx`
- `src/components/trips/trip-header.tsx`
- `src/components/trips/trip-city-banner.tsx`
- `src/components/trips/destination-card.tsx`
- `src/components/trips/departure-card.tsx`
- `src/components/trips/return-card.tsx`
- `src/components/layout/user-menu.tsx`

### Validation Run

- Ran `npm run build` after all changes.
- Result: build completed successfully (compile, lint, type checking, and static page generation all passed).

### Additional Error Fixes

- No additional runtime/type/build errors were encountered beyond the planned scope, so no extra corrective changes were required.
