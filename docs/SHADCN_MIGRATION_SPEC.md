# shadcn/ui Migration Spec

## Overview

Migrate all custom UI primitives in `src/components/ui/` to shadcn/ui components, preserving the current design system (colors, typography, spacing, animations) and 100% of existing functionality.

---

## Phase 1 Implementation Summary (Completed March 6, 2026)

Phase 1 (`Step 0` + `Step 1` to `Step 5`) has been implemented and validated.

### Completed Scope

- `Step 0: Prep`
  - Added `clsx` as a direct dependency in `package.json` and `package-lock.json`.
  - Updated `src/lib/utils.ts` to shadcn-standard `cn(...inputs)` using `clsx` + `twMerge`.
  - Added a full shadcn semantic CSS variable alias bridge to `src/app/globals.css` in both light and dark theme roots:
    - `--background`, `--foreground`
    - `--card`, `--card-foreground`
    - `--popover`, `--popover-foreground`
    - `--primary`, `--primary-foreground`
    - `--secondary`, `--secondary-foreground`
    - `--muted`, `--muted-foreground`
    - `--accent`, `--accent-foreground`
    - `--destructive`, `--destructive-foreground`
    - `--border`, `--input`, `--ring`, `--radius`
  - Added semantic Tailwind color mappings in `tailwind.config.ts` so shadcn classnames resolve correctly:
    - `background`, `card`, `popover`, `foreground.DEFAULT`
    - `primary.DEFAULT/foreground` (while preserving existing numeric primary scale)
    - `secondary`, `muted`, `accent.DEFAULT/foreground` (while preserving existing numeric accent scale)
    - `destructive`, `input`, `ring`

- `Step 1: Button`
  - Replaced `src/components/ui/button.tsx` with a shadcn-style CVA implementation.
  - Preserved the existing external API (`variant`, `size`, native button props).
  - Preserved requested variants: `default`, `outline`, `ghost`, `destructive`.
  - Preserved requested sizes:
    - `sm`: `h-11 px-3.5`
    - `default`: `h-11 px-4`
    - `lg`: `h-12 px-8`
  - Preserved active press behavior (`active:translate-y-px` and no active shadow).
  - Preserved disabled behavior (`disabled:pointer-events-none disabled:opacity-50`).

- `Step 2: Card`
  - Replaced `src/components/ui/card.tsx` with shadcn-style `forwardRef` primitives:
    - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - Preserved hover elevation and motion behavior.
  - Preserved padding contract (`p-5 sm:p-6`, content/footer top padding handling).

- `Step 3: Input`
  - Replaced `src/components/ui/input.tsx` with shadcn-style `forwardRef` primitive.
  - Preserved `h-11` sizing.
  - Updated focus ring to semantic `ring-ring` + `ring-offset-background` (mapped through aliases).
  - Preserved file input styling and disabled styles.

- `Step 4: Label`
  - Replaced `src/components/ui/label.tsx` with shadcn-style `forwardRef` primitive.
  - Preserved visual treatment (`text-sm font-medium leading-none text-foreground-secondary`).
  - Added standard peer-disabled styling.

- `Step 5: Textarea`
  - Replaced `src/components/ui/textarea.tsx` with shadcn-style `forwardRef` primitive.
  - Preserved `min-h-24` and existing typography/padding behavior.
  - Updated focus ring to semantic `ring-ring` + `ring-offset-background`.
  - Preserved disabled styles.

### Compatibility and Behavior Notes

- Import paths remain unchanged (`@/components/ui/*`), so consumer files required no import rewrites for Phase 1.
- Existing design system tokens remain intact; aliases are additive and non-breaking.
- Existing `primary`/`accent` numeric color scales were preserved to avoid regressions in any future or dynamic class usage.

### Validation Results

- `npm run lint`: passed (existing pre-migration warning in `src/components/layout/user-menu.tsx` for `@next/next/no-img-element` remains unchanged).
- `npm run build`: passed with successful type checking and production build output.

---

## Phase 2 Implementation Summary (Completed March 6, 2026)

Phase 2 (`Step 6` to `Step 9`) has been implemented and validated.

### Completed Scope

- `Step 6: Dialog`
  - Replaced `src/components/ui/dialog.tsx` custom focus-trap/escape/click-outside implementation with Radix Dialog primitives.
  - Preserved controlled API compatibility (`open` + `onOpenChange`) through `Dialog` (`DialogPrimitive.Root`) and kept compound exports:
    - `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
    - plus `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`
  - Preserved design/behavior contracts:
    - Overlay feel: `bg-canvas/80` + `backdrop-blur-md`
    - Animations: mobile `animate-slide-up`, desktop `animate-scale-in`, overlay `animate-fade-in`
    - Content sizing/styling: `max-w-lg`, responsive max-height, `border-border`, `bg-surface`, `shadow-modal`

- `Step 7: Popover`
  - Replaced `src/components/ui/popover.tsx` custom portal/viewport-positioning implementation with Radix Popover primitives.
  - Exported shadcn-style API:
    - `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
  - Preserved design tokens and motion:
    - `rounded-lg`, `border-border`, `bg-elevated`, `shadow-floating`, `animate-fade-in`
    - default `sideOffset={8}` preserved
  - Updated `src/components/ui/date-picker.tsx` to Radix/shadcn Popover composition (`PopoverTrigger` + `PopoverContent`) while preserving DatePicker external API and locale/date formatting behavior.

- `Step 8: Select`
  - Replaced `src/components/ui/select.tsx` custom context/listbox implementation with Radix Select primitives.
  - Preserved existing consumer contract (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`) and added standard shadcn exports:
    - `SelectGroup`, `SelectLabel`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
  - Preserved key styling/behavior:
    - Trigger height `h-11`
    - Input-like border/background treatment
    - Elevated floating content panel
    - Check-indicator selected state and keyboard navigation/focus handling via Radix

- `Step 9: DropdownMenu`
  - Replaced `src/components/ui/dropdown-menu.tsx` custom state-based implementation with Radix Dropdown Menu primitives.
  - Exported shadcn-style API:
    - `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`
    - plus `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuRadioGroup`
  - Preserved visual treatment:
    - `bg-elevated`, `border-border`, `shadow-floating`, rounded content, highlighted item background via `bg-subtle`
  - Verified current codebase has no active consumers of `@/components/ui/dropdown-menu` yet (UserMenu uses its own panel implementation).

### Dependency Updates

- Added required Radix dependencies in `package.json` and `package-lock.json`:
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-select`
  - `@radix-ui/react-dropdown-menu`

### Compatibility and Behavior Notes

- Import paths remain unchanged (`@/components/ui/*`) for all migrated primitives.
- DatePicker behavior and props remain intact (`value`, `onChange`, `disabled`, `locale`, `placeholder`, `id`) after switching to compound Popover composition.
- Overlay/popup positioning, escape handling, and focus management are now delegated to Radix across Dialog/Popover/Select/DropdownMenu.

### Validation Results

- `npm run lint`: passed (existing warning in `src/components/layout/user-menu.tsx` for `@next/next/no-img-element` remains unchanged).
- `npm run build`: passed with successful type checking and production build output.

---

## Phase 3 Implementation Summary (Completed March 6, 2026)

Phase 3 (`Step 10` + `Step 11`) has been implemented and validated.

### Completed Scope

- `Step 10: Calendar`
  - Reworked `src/components/ui/calendar.tsx` into a shadcn-style DayPicker wrapper while preserving project tokens and behavior.
  - Updated the component contract to allow standard class/component extension points (`classNames`, `components`) in addition to existing props.
  - Applied semantic selected-day styling (`bg-primary text-primary-foreground`) so selected dates resolve to existing brand tokens through the alias bridge.
  - Preserved today styling (`font-semibold text-brand-primary`).
  - Preserved custom chevron navigation visuals by wiring DayPicker's `Chevron` component to project iconography.
  - Kept `showOutsideDays` behavior (default enabled) and refined focus/disabled classes to align with migrated primitives (`ring-ring`, `ring-offset-background`, consistent disabled treatment).

- `Step 11: DatePicker`
  - Updated `src/components/ui/date-picker.tsx` styling pass to match the migrated Calendar composition without changing external API:
    - API preserved: `value`, `onChange`, `disabled`, `locale`, `placeholder`, `id`.
    - Trigger remains Button + PopoverTrigger composition.
    - Popover content now uses calendar-native sizing (`w-auto p-0`) for tighter shadcn-style integration.
    - Added `initialFocus` to Calendar for improved keyboard focus behavior on open.
  - Kept locale behavior for English/Spanish day-picker + display formatting.
  - Hardened date parsing in `toDate` with invalid-date guards (rejects malformed or out-of-range `YYYY-MM-DD` strings instead of coercing unexpected values).

### Compatibility and Behavior Notes

- Import paths remain unchanged (`@/components/ui/calendar`, `@/components/ui/date-picker`).
- Existing DatePicker consumer behavior is preserved (current active consumer: `src/components/trips/trip-header.tsx`).
- Phase 3 remained within scoped components only; no trip/layout feature refactors were introduced.

### Validation Results

- `npm run lint`: passed (existing warning in `src/components/layout/user-menu.tsx` for `@next/next/no-img-element` remains unchanged).
- `npm run build`: passed with successful type checking and production build output.

---

## Current State

- **Framework**: Next.js 14 App Router, TypeScript, Tailwind CSS 3
- **shadcn config**: `components.json` exists (New York style, RSC, CSS variables)
- **Deps already installed**: `tailwind-merge`, `class-variance-authority`, `react-day-picker`, `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`
- **Design tokens**: Custom CSS variables (`--bg-canvas`, `--fg-primary`, `--brand-primary`, etc.) that do NOT follow shadcn's expected naming (`--background`, `--foreground`, `--primary`, etc.)
- **`cn` utility**: shadcn-standard implementation at `src/lib/utils.ts` using `clsx` + `twMerge`
- **Migration progress**: Phase 1, Phase 2, and Phase 3 completed (`Step 0` to `Step 11`). Only explicitly out-of-scope components remain unchanged by design.

---

## Strategy

### Guiding Principles

1. **One component at a time** — migrate, verify, commit. Never break the app mid-migration.
2. **Preserve design tokens** — add a CSS variable alias layer so shadcn components resolve to the existing design system. Do NOT rename existing variables (consumers already use them).
3. **Preserve all functionality** — every interactive behavior (keyboard nav, focus traps, click-outside, animations) must work identically after migration.
4. **When in doubt, simplify** — if a custom styling detail has no clear mapping, drop it in favor of shadcn's default. The user has explicitly asked for this.
5. **No scope creep** — trip components and layout components are NOT being rewritten. They just need their imports updated to point at the new shadcn-based primitives.

### CSS Variable Bridge

Add aliases in `globals.css` so shadcn's expected variable names resolve to existing tokens:

```css
:root {
  /* shadcn expected vars -> existing design tokens */
  --background: var(--bg-canvas);
  --foreground: var(--fg-primary);
  --card: var(--bg-elevated);
  --card-foreground: var(--fg-primary);
  --popover: var(--bg-elevated);
  --popover-foreground: var(--fg-primary);
  --primary: var(--brand-primary);
  --primary-foreground: #ffffff;
  --secondary: var(--bg-subtle);
  --secondary-foreground: var(--fg-primary);
  --muted: var(--bg-subtle);
  --muted-foreground: var(--fg-muted);
  --accent: var(--bg-subtle);
  --accent-foreground: var(--fg-primary);
  --destructive: var(--danger);
  --destructive-foreground: #ffffff;
  --border: var(--border-default);
  --input: var(--border-default);
  --ring: var(--brand-primary);
  --radius: var(--radius-md);
}
```

The same pattern applies for the dark theme block (`:root[data-theme='dark']`). Since existing dark-mode variables already flip values, the aliases will automatically resolve correctly.

### `cn` Utility Update

Update `src/lib/utils.ts` to use `clsx` (shadcn's standard):

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**New dep**: `clsx`

---

## Component Migration Map

### Phase 1: Foundation (no Radix deps)

These components are simple wrappers. Migration is mostly cosmetic — swap implementations, adjust class names to use shadcn's token aliases.

| # | Component | shadcn component | Radix dep | Notes |
|---|-----------|-----------------|-----------|-------|
| 1 | `button.tsx` | `button` | No | Already uses CVA. Map variants: `default`, `outline`, `ghost`, `destructive`. Add custom sizes to match current `sm`/`lg`. Keep active press effect (`active:translate-y-px`). |
| 2 | `card.tsx` | `card` | No | Direct replacement. Override card classes to keep hover elevation effect and gradient top bar (consumed by TripCard). |
| 3 | `input.tsx` | `input` | No | Direct replacement. Adjust focus ring to use `--ring` (which aliases to `--brand-primary`). Keep file input styling. |
| 4 | `label.tsx` | `label` | `@radix-ui/react-label` | Direct replacement. Minimal change. |
| 5 | `textarea.tsx` | `textarea` | No | Direct replacement. Same focus ring treatment as Input. |

### Phase 2: Radix-powered overlays

These replace custom implementations (keyboard handling, focus traps, portals) with Radix primitives. This is where the biggest code reduction and reliability gain happens.

| # | Component | shadcn component | Radix dep | Notes |
|---|-----------|-----------------|-----------|-------|
| 6 | `dialog.tsx` | `dialog` | `@radix-ui/react-dialog` | Replaces ~120 lines of custom focus trap + keyboard + overlay logic with Radix Dialog. Preserve animation classes (`animate-fade-in`, `animate-scale-in`, `animate-slide-up`). Keep `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` compound API. **Key**: current Dialog uses a simple `open`/`onOpenChange` boolean prop pattern which matches Radix's API exactly. |
| 7 | `popover.tsx` | `popover` | `@radix-ui/react-popover` | Replaces ~150 lines of custom portal + position calculation. Radix handles viewport-aware positioning natively. Keep `align` prop mapping (`start`/`end`). The DatePicker consumes this — verify positioning still works after swap. |
| 8 | `select.tsx` | `select` | `@radix-ui/react-select` | Replaces ~180 lines of custom context + keyboard nav. Map: `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`. Current component uses check icon for selected item — shadcn Select does too. Preserve `h-11` trigger height. |
| 9 | `dropdown-menu.tsx` | `dropdown-menu` | `@radix-ui/react-dropdown-menu` | Replaces custom context-based dropdown. Map: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`. Used by UserMenu. |

### Phase 3: Composite components

| # | Component | shadcn component | Radix dep | Notes |
|---|-----------|-----------------|-----------|-------|
| 10 | `calendar.tsx` | `calendar` | No (uses `react-day-picker`) | Both current and shadcn versions wrap `react-day-picker`. Replace with shadcn's Calendar, then re-apply custom styling (brand-primary for selected day, custom nav icons, etc.). |
| 11 | `date-picker.tsx` | N/A (custom composite) | Inherits from Popover + Calendar | Not a shadcn component — it's a project-specific composite. After Popover and Calendar are migrated, update imports. Verify locale handling (en/es) still works. |

### Not Migrated (kept as-is)

| Component | Reason |
|-----------|--------|
| `spinner.tsx` | No shadcn equivalent. Simple SVG, no benefit to changing. |
| `view-transition-link.tsx` | Project-specific wrapper around Next.js Link. Not a UI primitive. |

---

## Detailed Migration Steps

### Step 0: Prep

1. Install `clsx`: `npm install clsx`
2. Update `src/lib/utils.ts` to shadcn's `cn` implementation.
3. Add CSS variable alias block to `globals.css` (both light and dark themes).
4. Verify the app still renders correctly — this step changes nothing visible.

### Step 1: Button

1. Run `npx shadcn@latest add button` (generates the shadcn Button with Radix Slot support).
2. Customize the generated file:
   - Add current custom variants if missing (ensure `default`, `outline`, `ghost`, `destructive` match current colors).
   - Add `active:translate-y-px` and `active:shadow-none` to base styles.
   - Match current size tokens: `sm` (h-11 px-3.5 text-body-sm), `default` (h-11 px-4 text-body-sm), `lg` (h-12 px-8 text-body-md).
   - Keep `disabled:pointer-events-none disabled:opacity-50` behavior.
3. Search all consumers: `grep -r "from.*components/ui/button" src/` — verify imports still work (path unchanged).
4. Visual check: trips list page, trip detail page, login page.

### Step 2: Card

1. Run `npx shadcn@latest add card`.
2. Customize: keep hover elevation (`hover:shadow-floating`), transition. The gradient top bar is applied by TripCard (consumer), not by Card itself — no change needed there.
3. Match current padding: `CardHeader` p-5 sm:p-6, `CardContent` p-5 pt-0 sm:p-6 sm:pt-0, etc.
4. Verify: trips list page (TripCard rendering).

### Step 3: Input

1. Run `npx shadcn@latest add input`.
2. Customize: `h-11`, focus ring using `ring-ring` (resolves to brand-primary via alias), file input pseudo-element styling.
3. Verify: new trip form, destination modal, trip header title input.

### Step 4: Label

1. Run `npx shadcn@latest add label`.
2. Minimal customization: ensure `text-sm font-medium text-muted-foreground` (maps to existing `text-foreground-secondary` via alias... but check this). If the alias doesn't perfectly match, add `text-foreground-secondary` override.
3. Verify: all forms.

### Step 5: Textarea

1. Run `npx shadcn@latest add textarea`.
2. Same treatment as Input (h-auto, min-h-24, focus ring).
3. Verify: destination modal notes field.

### Step 6: Dialog

1. Run `npx shadcn@latest add dialog` (installs `@radix-ui/react-dialog`).
2. Customize animations:
   - Overlay: `bg-canvas/80 backdrop-blur-md` (keep current feel, not shadcn's default `bg-black/80`).
   - Content: keep `animate-scale-in` on desktop, `animate-slide-up` on mobile. shadcn uses Tailwind `data-[state=open/closed]` animations — wire these to existing keyframes.
   - Max dimensions: `max-w-lg`, `max-h-[calc(100dvh-2rem)]` with overflow scroll.
3. **API compatibility check**: Current Dialog has `open` and `onOpenChange` props, same as Radix. `DialogContent` renders children. `DialogHeader/Footer/Title/Description` are layout wrappers — shadcn provides these identically.
4. Consumers to update:
   - `delete-trip-button.tsx` — uses Dialog for delete confirmation.
   - `destination-list.tsx` — uses Dialog for delete confirmation.
   - **Note**: `share-modal.tsx` and `destination-modal.tsx` use their OWN custom overlay implementations (not the Dialog component). These are NOT affected by this step. They could optionally be migrated to use Dialog in a future pass, but that's out of scope for this migration (functionality preservation).
5. Verify: delete trip flow, delete destination flow.

### Step 7: Popover

1. Run `npx shadcn@latest add popover` (installs `@radix-ui/react-popover`).
2. Customize: `bg-elevated`, `shadow-floating`, `border-border`, `rounded-lg`.
3. Map `align` prop: current component supports `start`/`end`, Radix Popover supports `start`/`center`/`end` natively.
4. **Key consumer**: DatePicker. The DatePicker passes `trigger`, `open`, `onOpenChange`, `children`, `align`, `disabled` to Popover. Radix Popover uses a slightly different composition pattern (Trigger + Content as children of root). The DatePicker will need a small refactor to use Radix's composition.
5. Verify: date pickers in trip header, destination modal.

### Step 8: Select

1. Run `npx shadcn@latest add select` (installs `@radix-ui/react-select`).
2. Customize trigger: `h-11`, same border/bg treatment as Input.
3. Customize content: `bg-elevated`, `shadow-floating`, `border-border`.
4. Customize item: selected state with check icon (shadcn already includes this).
5. **API mapping**: Current uses `<Select value={v} onValueChange={fn}>` wrapping `SelectTrigger > SelectValue` and `SelectContent > SelectItem`. Radix Select has the same compound pattern.
6. Consumers to check: transport type selectors in destination modal, departure/return transport modals.
7. Verify: all select dropdowns open, display selected value, keyboard navigate.

### Step 9: DropdownMenu

1. Run `npx shadcn@latest add dropdown-menu` (installs `@radix-ui/react-dropdown-menu`).
2. Customize content: `bg-elevated`, `shadow-floating`, `rounded-md`.
3. Customize item: `hover:bg-subtle`.
4. **Key consumer**: `user-menu.tsx`. The UserMenu currently uses the custom DropdownMenu but also has its own manual panel implementation for the expanded menu. Need to check whether UserMenu uses the DropdownMenu component or has its own overlay. Based on exploration: UserMenu has its OWN custom dropdown panel (not using the DropdownMenu component from ui/). So migrating `dropdown-menu.tsx` may have no current consumers. Verify with grep.
5. Verify: any component using `DropdownMenu` imports.

### Step 10: Calendar

1. Run `npx shadcn@latest add calendar`.
2. shadcn's Calendar also wraps `react-day-picker`. Replace custom classNames config with shadcn's, then override:
   - Selected day: `bg-primary text-primary-foreground` (resolves to brand-primary via alias).
   - Today: `font-semibold text-brand-primary`.
   - Navigation icons: keep current chevron styling.
3. Verify: date pickers work, locale switching (en/es) works, disabled dates respected.

### Step 11: DatePicker (refactor, not shadcn add)

1. After Popover and Calendar are migrated, update DatePicker to use the new Radix-based Popover composition pattern.
2. Keep all locale logic, string-to-date conversion, placeholder behavior.
3. Verify: both date pickers in trip header, date fields in modals.

---

## Consumer Impact Matrix

Which trip/layout components import which UI primitives — these files need import verification after each migration step:

| UI Component | Consumers |
|-------------|-----------|
| Button | `create-trip-button`, `delete-trip-button`, `departure-card`, `return-card`, `destination-list`, `destination-modal`, `import-trip-button`, `share-modal`, `trip-header`, `trip-city-banner`, `date-picker` |
| Card | `trip-card` |
| Dialog | `delete-trip-button`, `destination-list` |
| Input | `destination-list`, `destination-modal`, `trip-header`, `trip-city-banner` |
| Label | `destination-modal`, `departure-transport-modal`, `return-transport-modal` |
| Textarea | `destination-modal` |
| Select | `destination-modal`, `departure-transport-modal`, `return-transport-modal` |
| Popover | `date-picker` |
| Calendar | `date-picker` |
| DropdownMenu | Verify — may have zero consumers (UserMenu uses its own panel) |
| DatePicker | `trip-header` |
| Spinner | `destination-list`, `destination-modal`, `import-trip-button` |

---

## Radix Packages to Install

These will be installed automatically by `npx shadcn@latest add <component>`:

- `@radix-ui/react-dialog`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-slot` (used by Button's `asChild` prop)

---

## Risk Areas

1. **Popover positioning**: The current custom Popover has bespoke viewport-edge detection. Radix Popover handles this natively but may position differently in edge cases. Test on mobile viewports.

2. **Dialog animations**: Current Dialog has mobile-specific slide-up vs desktop scale-in. shadcn Dialog animates uniformly. Need to add responsive animation overrides via Tailwind breakpoint classes on `data-[state=open]`.

3. **Select scroll behavior**: Radix Select uses a virtualized viewport. If the current select has `max-h-72 overflow-y-auto`, Radix handles this differently (SelectScrollUpButton / SelectScrollDownButton). Test with long option lists.

4. **DatePicker composition change**: The Popover API changes from render-prop-like (`trigger` prop) to compound component (`PopoverTrigger` + `PopoverContent`). DatePicker internals will need restructuring, but external API (`value`, `onChange`, `locale`, `placeholder`) stays the same.

5. **Focus management**: Radix components manage focus aggressively. Verify that modal-within-modal flows (e.g., DestinationList opens delete Dialog) still work. Radix handles nested modals well, but test explicitly.

6. **Share Modal & Destination Modal**: These two components implement their OWN overlay/modal pattern (not using the Dialog component). They are NOT part of this migration. If desired, they can be refactored to use the shadcn Dialog in a follow-up, but that would change internal structure and is out of scope for a "preserve functionality" migration.

---

## Verification Checklist

After full migration, verify every flow:

- [ ] Login page renders correctly
- [ ] Trips list: cards display, create/import buttons work
- [ ] Create new trip: form inputs, date pickers, submit
- [ ] Trip detail: edit title, edit dates, export, share
- [ ] Trip city banner: edit departure/return cities
- [ ] Destination list: add, reorder (drag), edit, delete, expand/collapse
- [ ] Destination modal: all sections (basic, transport, accommodation, additional), all field types
- [ ] Departure/return transport modals: form fields, select dropdowns, save
- [ ] Delete trip: confirmation dialog, actual deletion
- [ ] Delete destination: confirmation dialog, actual deletion
- [ ] Share modal: generate link, copy to clipboard
- [ ] User menu: opens, language switch, theme switch, sign out
- [ ] Locale switcher: en/es toggle works
- [ ] Date pickers: calendar opens, date selection, locale-aware formatting
- [ ] Keyboard navigation: Tab through forms, Escape closes modals/popovers/selects
- [ ] Dark mode: all components render correctly in both themes
- [ ] Mobile: responsive layouts, touch interactions, modal sizing
- [ ] View transitions: page navigation animations still work

---

## Migration Order Summary

```
Step 0:  Prep (clsx, cn utility, CSS variable aliases)
Step 1:  Button
Step 2:  Card
Step 3:  Input
Step 4:  Label
Step 5:  Textarea
Step 6:  Dialog          (first Radix component)
Step 7:  Popover
Step 8:  Select
Step 9:  DropdownMenu
Step 10: Calendar
Step 11: DatePicker      (refactor to use new Popover + Calendar)
```

Each step is independently deployable. The app should be fully functional after every step.

---

## Out of Scope

- **ShareModal / DestinationModal / DepartureTransportModal / ReturnTransportModal**: These use their own overlay implementations. They could be refactored to use shadcn Dialog, but that changes internal structure beyond "swap the primitive." Can be a follow-up task.
- **UserMenu panel**: Has its own dropdown implementation. Could be swapped to shadcn DropdownMenu in a follow-up.
- **Spinner**: No shadcn equivalent. Kept as-is.
- **ViewTransitionLink**: Project-specific. Not a UI primitive.
- **Layout components** (Header, LocaleSwitcher): Not UI primitives. No migration needed.
- **Trip components**: Only import updates, no structural changes.
- **Tailwind config restructuring**: The custom token system stays. We only ADD alias variables.
- **`components.json` update**: May need minor adjustments if shadcn CLI expects different config shape. Handle as encountered.
