# Phase 3: Integration

## Scope
Wiring the day planner into the existing destination card/list components, adding i18n messages, updating the share/export feature, and adding activity count badges.

**Depends on:** Phase 1 (data layer) + Phase 2 (UI components)

---

## 1. i18n Messages

**Files:** `src/messages/en.json`, `src/messages/es.json`

### New `"activities"` namespace

Add after `"accommodation"` in both files.

**English (`en.json`):**
```json
"activities": {
  "title": "Activities",
  "schedule": "Schedule",
  "addActivity": "Add Activity",
  "editActivity": "Edit Activity",
  "noActivities": "No activities planned for this day",
  "quickAdd": "Quick add",
  "timeConflict": "This activity overlaps with another on the same day",
  "day": "Day {number}",
  "activitiesCount": "{count} activities",
  "deleteConfirm": "Delete this activity?",
  "name": "Activity name",
  "namePlaceholder": "What are you doing?",
  "startTime": "Start time",
  "endTime": "End time",
  "notes": "Notes",
  "notesPlaceholder": "Additional details...",
  "details": "Details",
  "meal": "Meal",
  "tour": "Tour",
  "ticketed": "Ticketed Event",
  "general": "Activity",
  "restaurantName": "Restaurant name",
  "cuisine": "Cuisine",
  "reservationTime": "Reservation time",
  "reservationCode": "Reservation code",
  "address": "Address",
  "tourCompany": "Tour company",
  "meetingPoint": "Meeting point",
  "guideContact": "Guide contact",
  "tourType": "Tour type",
  "tourTypeWalking": "Walking",
  "tourTypeBus": "Bus",
  "tourTypeBoat": "Boat",
  "tourTypeBike": "Bike",
  "tourTypeOther": "Other",
  "venue": "Venue",
  "ticketNumber": "Ticket number",
  "bookingCode": "Booking code",
  "bookingLink": "Booking link",
  "location": "Location",
  "description": "Description"
}
```

**Spanish (`es.json`):**
```json
"activities": {
  "title": "Actividades",
  "schedule": "Agenda",
  "addActivity": "Agregar Actividad",
  "editActivity": "Editar Actividad",
  "noActivities": "No hay actividades planificadas para este dia",
  "quickAdd": "Agregar rapido",
  "timeConflict": "Esta actividad se superpone con otra del mismo dia",
  "day": "Dia {number}",
  "activitiesCount": "{count} actividades",
  "deleteConfirm": "Eliminar esta actividad?",
  "name": "Nombre de la actividad",
  "namePlaceholder": "Que vas a hacer?",
  "startTime": "Hora de inicio",
  "endTime": "Hora de fin",
  "notes": "Notas",
  "notesPlaceholder": "Detalles adicionales...",
  "details": "Detalles",
  "meal": "Comida",
  "tour": "Tour",
  "ticketed": "Evento con entrada",
  "general": "Actividad",
  "restaurantName": "Nombre del restaurante",
  "cuisine": "Tipo de cocina",
  "reservationTime": "Hora de reserva",
  "reservationCode": "Codigo de reserva",
  "address": "Direccion",
  "tourCompany": "Empresa de tours",
  "meetingPoint": "Punto de encuentro",
  "guideContact": "Contacto del guia",
  "tourType": "Tipo de tour",
  "tourTypeWalking": "A pie",
  "tourTypeBus": "Bus",
  "tourTypeBoat": "Barco",
  "tourTypeBike": "Bicicleta",
  "tourTypeOther": "Otro",
  "venue": "Lugar",
  "ticketNumber": "Numero de entrada",
  "bookingCode": "Codigo de reserva",
  "bookingLink": "Link de reserva",
  "location": "Ubicacion",
  "description": "Descripcion"
}
```

### New error messages

Add to the `"errors"` namespace in both files:

**English:**
```json
"saveActivity": "Could not save the activity. Please try again.",
"deleteActivity": "Could not delete the activity. Please try again.",
"activityNameRequired": "Enter a name for the activity."
```

**Spanish:**
```json
"saveActivity": "No se pudo guardar la actividad. Intenta de nuevo.",
"deleteActivity": "No se pudo eliminar la actividad. Intenta de nuevo.",
"activityNameRequired": "Ingresa un nombre para la actividad."
```

### Implementation suggestions

> The Spanish translations above intentionally omit accents/tildes on some words (e.g., "dia" instead of "dia") to match the existing convention in `es.json` (the file currently has "proxima" without accent, "estes" without accent, etc.). Follow whatever convention the project uses.

---

## 2. Destination Card Changes

**File:** `src/components/trips/destination-card.tsx`

### Changes needed

1. **Add activity count indicator** in the card header, next to the transport and accommodation icons.

   Current icon row (line ~237):
   ```tsx
   {hasTransport ? <TransportIcon ... /> : null}
   {hasAccommodation ? <Hotel ... /> : null}
   ```

   Add after these:
   ```tsx
   {activityCount > 0 ? <CalendarDays ... className="h-4 w-4 text-brand-primary" /> : null}
   ```

2. **Add `CalendarDays` to lucide imports** and import `Badge` from shadcn.

3. **Add schedule button** to the action area or as a new row. This button opens the day planner.

   Option A: Add a button below the details section that says "Schedule" with the activity count.
   Option B: Add a `CalendarDays` icon button in the header action area (next to the 3-dot menu).

   The plan suggests Option B for consistency with the existing compact header layout.

4. **New props needed:**
   ```typescript
   activityCount: number;
   onOpenSchedule: (destinationId: number) => void;
   ```

5. **Hide schedule button for stopovers** (duration = 0, no days to plan).

### Implementation suggestions

> The activity count can be computed by the parent (`destination-list.tsx`) from `destination.activities.length`. Don't compute it inside the card.

> For the schedule button, consider adding it as an icon button next to the 3-dot menu. Use `CalendarDays` icon. Add a `Badge` overlay or adjacent text showing the count only when > 0.

> Alternatively, add the schedule button as a new clickable row below the preview section (like the "Show details" button but for schedule). This may be more discoverable.

---

## 3. Destination List Changes

**File:** `src/components/trips/destination-list.tsx`

### State changes

Add to the reducer state:
```typescript
scheduleOpenId: number | null;
```

Add to the action union:
```typescript
| { type: 'OPEN_SCHEDULE'; destinationId: number }
| { type: 'CLOSE_SCHEDULE' }
```

Add to `createInitialState`:
```typescript
scheduleOpenId: null
```

Add reducer cases:
```typescript
case 'OPEN_SCHEDULE':
  return { ...state, scheduleOpenId: action.destinationId };
case 'CLOSE_SCHEDULE':
  return { ...state, scheduleOpenId: null };
```

### Rendering changes

After each `DestinationCard` in the map, conditionally render the `DayPlanner`:

```tsx
{scheduleOpenId === destination.destination_id ? (
  <DayPlanner
    destinationId={destination.destination_id}
    tripId={tripId}
    locale={locale}
    duration={destination.duration}
    activities={destination.activities}
    startDate={computedStartDate}
  />
) : null}
```

### Dynamic import

Match the `DestinationModal` pattern:
```typescript
const DayPlanner = dynamic(() =>
  import('./day-planner').then((mod) => mod.DayPlanner)
);
```

### New handlers

```typescript
const handleOpenSchedule = useCallback((destinationId: number) => {
  dispatch(
    state.scheduleOpenId === destinationId
      ? { type: 'CLOSE_SCHEDULE' }
      : { type: 'OPEN_SCHEDULE', destinationId }
  );
}, [state.scheduleOpenId]);
```

### Pass to DestinationCard

```tsx
<DestinationCard
  ...existing props
  activityCount={destination.activities.length}
  onOpenSchedule={handleOpenSchedule}
/>
```

### Implementation suggestions

> The `DayPlanner` should be rendered below the destination card's wrapper div, but still inside the timeline layout (so the timeline line continues through it). You may need to adjust the JSX structure slightly.

> Consider whether opening a schedule should close an expanded card's details (or vice versa). They're independent concerns, so probably let them coexist.

> Activity mutations from the day planner need to update the parent state. Options:
> 1. Let the day planner manage its own state and rely on `revalidatePath` to refresh on next navigation
> 2. Pass callback props to update activities in the destination-list reducer
> 3. Use optimistic state in the day planner and let server revalidation sync the source of truth
>
> Option 3 is simplest and matches how quick-add works in the existing destination form.

---

## 4. Share/Export Support

### Export (`src/lib/utils/import-export.ts`)

Add activities to the export format:

```typescript
export interface ExportedActivity {
  category: ActivityCategory;
  name: string;
  dayNumber: number;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  details: Record<string, unknown>;
}

// Update ExportedDestination:
export interface ExportedDestination {
  // ... existing fields
  activities: ExportedActivity[];  // <-- new
}
```

In `exportTrip`, add to each destination:
```typescript
activities: destination.activities.map(activity => ({
  category: activity.category,
  name: activity.name,
  dayNumber: activity.day_number,
  startTime: activity.start_time,
  endTime: activity.end_time,
  notes: activity.notes,
  details: activity.details
}))
```

In `validateImportData` / `isExportedDestination`, add validation for the `activities` array. Activities should be optional in the import format (default to `[]`) for backwards compatibility with exports that don't have them.

### Implementation suggestions

> For backwards compatibility: when importing a trip that has no `activities` field on a destination, treat it as `activities: []`. Don't fail validation.

> The import action in the app would need to create activities for each destination after creating the destination itself. This may require changes to the trip import flow. If the import flow is simple, add it now. If it's complex, defer to a follow-up.

### Shared view (`src/components/trips/trip-view-only.tsx`)

Add activities display for each destination in the read-only view.

After the notes/budget section of each destination card, show:
```tsx
{destination.activities.length > 0 ? (
  <div className="mt-3 border-t border-border pt-3">
    <h4 className="text-sm font-semibold text-brand-primary mb-2">
      {tActivities('title')} ({destination.activities.length})
    </h4>
    {/* Group by day, show activity name + time + category icon */}
  </div>
) : null}
```

### Implementation suggestions

> The shared view doesn't need the full day planner UI. A simple grouped list (by day) with activity name, time, and category icon is sufficient. Keep it read-only -- no edit/delete buttons, no quick-add.

> Consider whether the day grouping should use tabs or just headings. Headings are simpler and better for a read-only scan view.

---

## 5. Stopovers

Stopovers have `duration = 0`. They should NOT show the schedule button since there are no days to plan activities for.

### Where to enforce
- `DestinationCard`: don't render the schedule button if `destination.is_stopover` or `destination.duration === 0`
- `DestinationList`: don't open schedule for stopovers (defensive check)

---

## Acceptance Criteria

### i18n
- [ ] All new UI strings are in both `en.json` and `es.json`
- [ ] Switching locale correctly translates all activity-related text
- [ ] No hardcoded strings in components

### Destination Card Integration
- [ ] `CalendarDays` icon appears in header when destination has activities
- [ ] Activity count is correct
- [ ] Schedule button opens/closes the day planner
- [ ] Schedule button is hidden for stopovers (duration = 0)
- [ ] Existing card functionality (expand, edit, delete, drag) is unchanged

### Destination List Integration
- [ ] Day planner renders inline below the destination card when schedule is open
- [ ] Only one schedule can be open at a time (opening another closes the previous)
- [ ] Day planner is dynamically imported (not in initial bundle)
- [ ] Timeline visual continuity is maintained when planner is open
- [ ] Opening schedule doesn't break drag-and-drop reordering
- [ ] Closing schedule (clicking the button again) hides the planner

### Export
- [ ] Exported JSON includes `activities` array per destination
- [ ] Activities include category, name, dayNumber, times, notes, details
- [ ] Import of a JSON without `activities` field still works (backwards compatible)
- [ ] Import of a JSON with `activities` creates the activities in the database

### Shared View
- [ ] Activities are visible in the read-only shared trip view
- [ ] Activities are grouped by day with day headings
- [ ] Each activity shows category icon, name, and time range
- [ ] No edit/delete controls in shared view
- [ ] Empty state: no activities section shown when destination has no activities

### Stopovers
- [ ] No schedule button on stopover cards
- [ ] No activities section in shared view for stopovers

## Validation Plan

1. **i18n:** Switch between en/es locale, verify all new strings translate
2. **Destination card:** Create a destination with activities, verify icon and count badge appear
3. **Destination list:** Open schedule on a destination, verify day planner renders below the card
4. **Open/close:** Click schedule button twice, verify planner toggles
5. **Multiple destinations:** Open schedule on one, then another -- first closes, second opens
6. **Stopovers:** Add a stopover, verify no schedule button appears
7. **Export:** Export a trip with activities, open the JSON, verify activities are present
8. **Import:** Import the exported JSON into a new trip, verify activities are recreated
9. **Import backwards compat:** Import an old JSON (no activities field), verify it imports without errors
10. **Shared view:** Share a trip with activities, open the shared link, verify activities are visible and read-only
11. **Drag-and-drop:** With a schedule open, drag-reorder destinations, verify it still works
12. **Full end-to-end:** Create trip -> add destination -> open schedule -> add activity (quick-add) -> add activity (modal) -> verify times, conflict warning -> refresh page -> activities persist -> export -> import -> activities present

---

## Implementation Summary (2026-03-07)

### Completed work

1. Destination card integration (`src/components/trips/destination-card.tsx`)
   - Added activities translation usage in the card.
   - Added `CalendarDays` activity indicator in the header icon row when `activityCount > 0`.
   - Added schedule action button in the header actions area:
     - opens/closes schedule through `onOpenSchedule(destinationId)`
     - shows count badge when activities exist
     - hidden for stopovers and destinations with `duration = 0`
   - Extended props with:
     - `activityCount: number`
     - `onOpenSchedule: (destinationId: number) => void`

2. Destination list integration (`src/components/trips/destination-list.tsx`)
   - Added reducer state `scheduleOpenId: number | null`.
   - Added reducer actions:
     - `OPEN_SCHEDULE`
     - `CLOSE_SCHEDULE`
   - Added defensive checks to prevent opening schedule for stopovers / `duration < 1`.
   - Wired destination card schedule trigger:
     - passes `activityCount={destination.activities.length}`
     - passes `onOpenSchedule={handleOpenSchedule}`
   - Added dynamic import for day planner:
     - `const DayPlanner = dynamic(() => import('./day-planner').then((mod) => mod.DayPlanner))`
   - Renders `DayPlanner` inline under the selected destination card only (single-open behavior).
   - Passes computed destination `startDate` via `getDestinationDates(...)`.
   - Preserves existing drag-and-drop and destination CRUD behavior.

3. Export/import format support (`src/lib/utils/import-export.ts`)
   - Added `ExportedActivity` type:
     - `category`, `name`, `dayNumber`, `startTime`, `endTime`, `notes`, `details`
   - Extended exported destinations with `activities` in `exportTrip(...)`.
   - Added activities validation in `validateImportData(...)`:
     - validates category and required activity fields
     - validates `details` as object
   - Kept backwards compatibility:
     - `activities` is optional in import format
     - missing `activities` is accepted as `[]`

4. Import persistence for activities (`src/app/actions/trips.ts`)
   - Added `createActivity` usage in trip import flow.
   - After each destination import, creates destination activities (if present) with:
     - category/name/day/time/notes/details
   - Normalizes imported activity day to fit destination duration bounds.
   - Existing import behavior for departure/return transport, destination transport, and accommodation remains intact.

5. Shared view integration (`src/components/trips/trip-view-only.tsx`)
   - Added read-only activities section per destination when activities exist.
   - Groups activities by day with day headings (`activities.day`).
   - Shows category icon, activity name, and optional time range per row.
   - Keeps section hidden for:
     - destinations without activities
     - stopovers / `duration = 0`

6. Test fixture updates
   - Updated destination card test props to match current component API:
     - `src/components/trips/__tests__/destination-card.test.tsx`
   - Extended import/export utility test coverage for activity export + import validation:
     - `src/lib/utils/__tests__/import-export.test.ts`

### Validation executed

1. `npm run lint`
   - Result: success (no ESLint warnings/errors).

2. `npm run build`
   - Result: success (Next.js production build completed with compile + type checking).

### Notes

- No additional follow-up fixes were required after lint/build; integration compiled cleanly on first validation run.
