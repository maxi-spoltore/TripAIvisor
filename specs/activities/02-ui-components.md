# Phase 2: UI Components

## Scope
All new React components for the activities feature: category picker, activity modal (create/edit form), activity card, and day planner. Also includes installing required shadcn components.

**Depends on:** Phase 1 (types and server actions must exist)

---

## 0. shadcn Component Installation

Install before building UI:

```bash
npx shadcn@latest add tabs badge tooltip
```

This adds:
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` -- for day navigation
- `Badge` -- for activity count badges and time display
- `Tooltip` / `TooltipTrigger` / `TooltipContent` / `TooltipProvider` -- for conflict warning details

### Implementation suggestions

> Verify that `@radix-ui/react-tabs` and `@radix-ui/react-tooltip` don't conflict with existing Radix packages. The project already uses `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-popover`, so there should be no issues. Check `package.json` after installation.

---

## 1. Activity Category Picker

**File:** `src/components/trips/activity-category-picker.tsx`

### Purpose
A grid of 4 category buttons for the user to select before opening the full activity form. Shown inline in the day planner when the user clicks "+ Add Activity".

### Props
```typescript
type ActivityCategoryPickerProps = {
  onSelect: (category: ActivityCategory) => void;
  disabled?: boolean;
};
```

### Behavior
- Renders a 2x2 grid (or 4-column on wider screens) of category buttons
- Each button shows the category icon + localized label
- Clicking a button calls `onSelect(category)`
- Uses the `activities` i18n namespace for labels

### Category visual mapping

| Category | Icon (lucide) | Color class |
|----------|--------------|-------------|
| `meal` | `UtensilsCrossed` | `text-warning` (orange) |
| `tour` | `Map` | `text-route` (teal) |
| `ticketed` | `Ticket` | `text-brand-accent` (coral) |
| `general` | `MapPin` | `text-foreground-secondary` (neutral) |

### Implementation suggestions

> Use shadcn `Button` with `variant="ghost"` for the category cards. Style them as bordered cards with the category color on the icon. Keep it simple -- no hover animations needed beyond the default button hover.

> Consider making the icon/color mapping a shared constant (e.g., `ACTIVITY_CATEGORY_CONFIG`) that both this component and the activity card can reference. This avoids duplicating the mapping.

---

## 2. Activity Modal (Create/Edit Form)

**File:** `src/components/trips/activity-modal.tsx`

### Purpose
Dialog for creating or editing an activity. Shows common fields + category-specific fields.

### Props
```typescript
type ActivityModalProps = {
  activity: Activity | null;         // null = create mode
  category: ActivityCategory;        // pre-selected category
  dayNumber: number;                 // pre-selected day
  destinationId: number;
  open: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onSave: (payload: ActivityModalSubmitInput) => void;
};

type ActivityModalSubmitInput = {
  activityId?: number;               // present in edit mode
  destinationId: number;
  category: ActivityCategory;
  name: string;
  day_number: number;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  details: Record<string, unknown>;
};
```

### Form structure

**Common fields (all categories):**
| Field | Component | Required | Type |
|-------|-----------|----------|------|
| `name` | `Input` | Yes | text |
| `start_time` | `Input` | No | time |
| `end_time` | `Input` | No | time |
| `notes` | `Textarea` | No | text |

**Category-specific fields (rendered in a collapsible section, expanded by default):**

Each renders as a labeled `Input` (or `Select` for enum-like fields). All are optional.

**Meal:**
| Field key | Label (i18n) | Component |
|-----------|-------------|-----------|
| `restaurant_name` | Restaurant name | `Input` |
| `cuisine` | Cuisine | `Input` |
| `reservation_time` | Reservation time | `Input` (time) |
| `reservation_code` | Reservation code | `Input` |
| `address` | Address | `Input` |

**Tour:**
| Field key | Label (i18n) | Component |
|-----------|-------------|-----------|
| `tour_company` | Tour company | `Input` |
| `meeting_point` | Meeting point | `Input` |
| `guide_contact` | Guide contact | `Input` |
| `tour_type` | Tour type | `Select` (walking, bus, boat, bike, other) |

**Ticketed:**
| Field key | Label (i18n) | Component |
|-----------|-------------|-----------|
| `venue` | Venue | `Input` |
| `ticket_number` | Ticket number | `Input` |
| `booking_code` | Booking code | `Input` |
| `booking_link` | Booking link | `Input` |
| `address` | Address | `Input` |

**General:**
| Field key | Label (i18n) | Component |
|-----------|-------------|-----------|
| `location` | Location | `Input` |
| `description` | Description | `Input` |

### Behavior
- Follow `destination-modal.tsx` pattern: `useEffect` to initialize form state from `activity` prop, `formState` managed via `useState`
- `name` is required -- show error if empty on submit
- `start_time` / `end_time` validation: if both set, `end_time` should be after `start_time`
- Category-specific fields are stored/read from `details` JSONB
- On submit, construct `ActivityModalSubmitInput` and call `onSave`
- Dialog uses `DialogContent/Header/Footer/Title` from shadcn

### Implementation suggestions

> The form state for category-specific fields can be a flat `Record<string, string>` since all detail values are strings. On submit, convert to the `details` object by filtering out empty strings.

> Consider rendering category fields via a config-driven approach:
> ```typescript
> const CATEGORY_FIELDS: Record<ActivityCategory, FieldConfig[]> = { ... }
> ```
> This avoids repetitive JSX per category. But if you prefer explicit JSX per category, that's fine too -- readability is more important than DRY here.

> For the `tour_type` Select, the options are: `walking`, `bus`, `boat`, `bike`, `other`. These should be i18n'd.

---

## 3. Activity Card

**File:** `src/components/trips/activity-card.tsx`

### Purpose
Compact row card showing a single activity in the day planner list.

### Props
```typescript
type ActivityCardProps = {
  activity: Activity;
  hasConflict?: boolean;
  isPending?: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: number) => void;
};
```

### Visual structure
```
[Color border] [Icon] Activity Name          [10:00 - 12:00] [Edit] [Delete]
                      Restaurant: La Piazza   [!] conflict
```

- Left border color based on category (same color mapping as category picker)
- Category icon (small, matching color)
- Activity name as primary text
- Time range shown in a `Badge` (outline variant) if `start_time` is set
- One-line preview of key detail:
  - Meal: `restaurant_name`
  - Tour: `tour_company`
  - Ticketed: `venue`
  - General: `location`
- Edit button (ghost, opens modal) and delete button (ghost/destructive)
- If `hasConflict` is true: show `AlertTriangle` icon with a `Tooltip` explaining the overlap

### Implementation suggestions

> Use shadcn `Card` as the base but keep it minimal -- a bordered `div` with `rounded-lg` and left border color may be simpler than full `CardHeader/CardContent` structure.

> The key detail preview can be extracted from `activity.details` using the category to pick the right field. A helper function `getActivityPreviewField(activity: Activity): string | null` keeps the component clean.

> For delete, consider whether to show a confirmation dialog or delete immediately with undo. The current codebase uses confirmation for destinations. For activities (less critical data), immediate delete with optimistic UI may be better UX. Either approach is acceptable.

---

## 4. Day Planner

**File:** `src/components/trips/day-planner.tsx`

### Purpose
Main schedule component. Shows day tabs and the activity list for the selected day. This is the top-level component rendered inline below each destination card.

### Props
```typescript
type DayPlannerProps = {
  destinationId: number;
  tripId: number;
  locale: string;
  duration: number;                // number of days at this destination
  activities: Activity[];          // all activities for this destination
  startDate: string | null;        // computed start date for this destination
};
```

### Visual structure
```
[Day 1 (Mar 8) 3] [Day 2 (Mar 9) 1] [Day 3 (Mar 10) 0]    <-- Tabs with Badge counts

Activity Card 1 (timed, 10:00)
Activity Card 2 (timed, 14:00)
Activity Card 3 (untimed)

--- Quick Add ---
[Name input] [Category select] [Time input] [+ Add]

[+ Add Activity]  <-- opens category picker, then modal
```

### Day tabs
- Use shadcn `Tabs` component
- One tab per day (1 to `duration`)
- Each tab trigger shows: "Day N" + computed date (if `startDate` is available) + `Badge` with activity count for that day
- Default to Day 1

### Activity list (per selected day)
- Filter `activities` by `day_number === selectedDay`
- Sort: timed activities first (by `start_time` asc), then untimed (by `position`)
- Render each as `ActivityCard`
- Run time conflict detection on the list (see Section 5)
- If no activities for the day: show empty state message

### Quick-add inline form
A compact single-row form at the bottom of the activity list:
- `Input` for name (required)
- `Select` for category (default: `general`)
- `Input` for start_time (optional, type="time")
- `Button` to submit

On submit:
1. Call `createActivityAction` with the quick-add values
2. Optimistically add to the local list
3. Clear the form

### Full add flow
- "+ Add Activity" button opens the category picker inline
- After picking a category, opens the activity modal in create mode
- On save, calls `createActivityAction`, adds to list

### Edit flow
- Click on an activity card calls `onEdit` -> opens activity modal in edit mode
- On save, calls `updateActivityAction`, updates in list

### Delete flow
- Click delete on activity card -> calls `deleteActivityAction`, removes from list

### State management
- Local state via `useState` (or `useReducer` if complexity grows)
- Activities are passed as props from the parent (destination-list), but the day planner manages its own UI state (selected day, quick-add form values, editing activity, pending states)
- Use `useTransition` for server action calls (matches existing pattern)
- Optimistic updates: add/remove activities from local state immediately, rollback on error

### Implementation suggestions

> The `startDate` for each destination can be computed from the trip's `startDate` + sum of previous destinations' durations. This computation already exists in `getDestinationDates` from `src/lib/utils/dates.ts`. Pass the computed start date from the parent.

> Consider whether the day planner should manage its own activity list state or receive it as a prop from destination-list. Prop approach is simpler (single source of truth) but means destination-list needs to update activities in its reducer. State approach is more isolated but can get out of sync. Either is fine -- the plan suggests prop-based to match the existing architecture.

> For `Tabs`, the `value` prop controls the selected tab. Use `string` values like `"1"`, `"2"`, etc. since Radix Tabs uses string values.

---

## 5. Time Conflict Detection

**Location:** Logic in `day-planner.tsx`, visual indicator on `activity-card.tsx`

### Algorithm
For each day's activity list, compare every pair of timed activities. Two activities conflict if their time ranges overlap:
- A.start < B.end AND B.start < A.end
- Only activities with both `start_time` and `end_time` set can conflict
- Activities with only `start_time` (no `end_time`) do not participate in conflict detection

### Output
A `Set<number>` of `activity_id`s that have at least one conflict. Pass `hasConflict={conflictIds.has(activity.activity_id)}` to each `ActivityCard`.

### Visual indicator
On `ActivityCard`, when `hasConflict` is true:
- Show `AlertTriangle` icon (lucide) in `text-warning` color
- Wrap in shadcn `Tooltip` with message from i18n (`activities.timeConflict`)

### Implementation suggestions

> The conflict check is O(n^2) but n is small (activities per day per destination). No optimization needed.

> Extract the conflict detection to a pure function:
> ```typescript
> function findConflictingActivityIds(activities: Activity[]): Set<number>
> ```
> This makes it testable without rendering components.

---

## Acceptance Criteria

### Category Picker
- [ ] Renders 4 category buttons with correct icons and labels
- [ ] Each button calls `onSelect` with the correct category
- [ ] Buttons are disabled when `disabled` prop is true
- [ ] Labels are localized (en + es)

### Activity Modal
- [ ] Opens in create mode (empty form) when `activity` is null
- [ ] Opens in edit mode (pre-filled form) when `activity` is provided
- [ ] Shows correct category-specific fields based on `category`
- [ ] `name` field is required -- shows error if empty on submit
- [ ] Time validation: warns if `end_time` is before `start_time`
- [ ] Category-specific fields are optional
- [ ] `onSave` is called with correctly shaped `ActivityModalSubmitInput`
- [ ] `onCancel` closes the dialog
- [ ] Form is disabled while `isPending` is true
- [ ] Spinner shows on save button while pending

### Activity Card
- [ ] Shows category icon with correct color
- [ ] Shows activity name
- [ ] Shows time range in a Badge when times are set
- [ ] Shows key detail preview (restaurant name, venue, etc.)
- [ ] Edit button opens the activity modal
- [ ] Delete button removes the activity
- [ ] Shows conflict warning icon + tooltip when `hasConflict` is true
- [ ] No conflict indicator when `hasConflict` is false

### Day Planner
- [ ] Shows correct number of day tabs (1 per day of destination duration)
- [ ] Each tab shows computed date when trip start date is available
- [ ] Each tab shows activity count badge
- [ ] Switching tabs shows activities for that day only
- [ ] Activities are sorted: timed first (by start_time), then untimed (by position)
- [ ] Empty state shows message when no activities for a day
- [ ] Quick-add form creates an activity with name + category + optional time
- [ ] Quick-add clears form after successful creation
- [ ] "+ Add Activity" button shows category picker, then opens modal
- [ ] Edit flow: clicking activity opens modal with pre-filled data
- [ ] Delete flow: deleting activity removes it from the list
- [ ] Optimistic updates work (activity appears/disappears immediately)
- [ ] Rollback on server error (activity reappears/disappears)
- [ ] Time conflict warnings appear for overlapping activities
- [ ] All text is localized (en + es)

### Time Conflict Detection
- [ ] Correctly identifies overlapping time ranges
- [ ] Does not flag activities without `end_time`
- [ ] Does not flag activities on different days
- [ ] Returns empty set when no conflicts exist

## Validation Plan

1. Install shadcn components, verify they render correctly
2. Build category picker in isolation, verify click handlers
3. Build activity modal, test create and edit modes with each category
4. Build activity card, verify visual rendering for each category
5. Build day planner with mock data, verify tab switching and sorting
6. Test quick-add form end-to-end (creates activity, appears in list, persists on reload)
7. Test edit flow end-to-end (changes persist)
8. Test delete flow end-to-end (activity removed, persists on reload)
9. Create two overlapping activities, verify conflict warning appears
10. Test with `prefers-reduced-motion` enabled (no animations should run)
11. Test responsive layout (mobile: stack form fields vertically)

---

## Implementation Summary (2026-03-07)

### Completed work

1. Installed required shadcn primitives for Phase 2:
   - Ran `npx shadcn@latest add tabs badge tooltip --yes`
   - Added:
     - `src/components/ui/tabs.tsx`
     - `src/components/ui/badge.tsx`
     - `src/components/ui/tooltip.tsx`
   - Added dependencies in `package.json`:
     - `@radix-ui/react-tabs`
     - `@radix-ui/react-tooltip`
     - `@radix-ui/react-slot` (required by generated shadcn files)

2. Added shared activity category UI config/helpers:
   - New file: `src/components/trips/activity-config.ts`
   - Includes:
     - shared category list/config (`ACTIVITY_CATEGORIES`, `ACTIVITY_CATEGORY_CONFIG`)
     - icon/color mapping used by picker + card
     - shared helpers for preview field extraction and time parsing/formatting

3. Implemented Activity Category Picker:
   - New file: `src/components/trips/activity-category-picker.tsx`
   - Implemented 4 category buttons with icon + localized label
   - Supports disabled state and `onSelect(category)`

4. Implemented Activity Modal (create/edit):
   - New file: `src/components/trips/activity-modal.tsx`
   - Implemented:
     - create/edit mode initialization from props
     - required name validation
     - start/end time ordering validation (`end_time > start_time`)
     - category-specific fields (meal, tour, ticketed, general)
     - `tour_type` select (`walking`, `bus`, `boat`, `bike`, `other`)
     - details serialization to JSON object (empty values removed)
     - disabled/pending state and save spinner

5. Implemented Activity Card:
   - New file: `src/components/trips/activity-card.tsx`
   - Implemented:
     - category color/icon rendering with left color border
     - name + key detail preview extraction from `details`
     - time badge rendering
     - edit/delete action buttons
     - conflict warning indicator with tooltip (`activities.timeConflict`)

6. Implemented Day Planner:
   - New file: `src/components/trips/day-planner.tsx`
   - Implemented:
     - day tabs (`Tabs`) for destination duration
     - computed date per tab from `startDate`
     - per-day activity count badge
     - per-day activity filtering + sorting:
       - timed first (by `start_time`)
       - untimed then by `position`
     - quick-add inline form (name/category/start_time)
     - full add flow (`+ Add Activity` -> category picker -> modal)
     - edit flow (card -> modal)
     - delete flow from activity card
     - optimistic create/update/delete with rollback on action failure
     - conflict detection via pure function:
       - `findConflictingActivityIds(activities): Set<number>`
       - overlap rule: `A.start < B.end && B.start < A.end`

7. Added localization keys required by the new Phase 2 UI:
   - Updated:
     - `src/messages/en.json`
     - `src/messages/es.json`
   - Added:
     - `activities` namespace used by picker/modal/card/day-planner
     - `errors.saveActivity`
     - `errors.deleteActivity`
     - `errors.activityNameRequired`
     - `errors.activityTimeRangeInvalid`

### Validation executed

1. `npm run lint`
   - Result: success (no ESLint warnings/errors).

2. `npm run build`
   - Result: success (Next.js build + app type checks completed).

3. `npx tsc --noEmit`
   - Result: fails due pre-existing repo test/tooling issues unrelated to Phase 2 UI runtime code:
     - missing test deps/types (`vitest`, `@testing-library/react`)
     - existing stale test typing mismatches in test files
   - No additional TypeScript errors were introduced by the new Phase 2 component files in app build validation (`npm run build` passed).
