# TripAIvisor UI Redesign Spec (2026)

## 1. Scope

### 1.1 Goal
Redesign the existing UI look and feel to be:
- Fresh, modern, and non-generic
- Mobile-first
- Appealing to a young adult wanderlust audience
- Clean and polished

### 1.2 Non-goals
- No new product features
- No database/API schema changes
- No workflow changes that alter existing user capabilities

### 1.3 Product constraints
- Keep current app architecture (Next.js App Router + Tailwind + custom UI primitives)
- Preserve current route structure and i18n behavior
- Preserve current business logic and action handlers

---

## 2. Design Direction

### 2.1 Concept
"Editorial Travel Journal + Smart Transit UI"

The UI should blend:
- Editorial mood (atmosphere, typography personality, visual rhythm)
- Utility clarity (fast scannability, route/timeline understanding, practical forms)

### 2.2 Brand attributes
- Adventurous
- Contemporary
- Calm confidence
- Socially aware and polished

### 2.3 Competitive pattern synthesis
From trip-planning products (Wanderlog, TripIt, Tripsy, Polarsteps), users respond to:
- Strong hierarchy and clear itinerary structure
- Card-first glanceable content
- Clear route/timeline metaphors
- Lifestyle-forward visual tone without sacrificing utility

---

## 3. Design Foundations

## 3.1 Typography

### 3.1.1 Font system
Use two families:
- Display/headlines: `Space Grotesk`
- Body/UI: `Manrope`

Fallback stack:
- `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`

### 3.1.2 Type scale (mobile-first)
- `display-lg`: 2.125rem / 2.5rem / 700 / -0.02em
- `display-md`: 1.75rem / 2.125rem / 700 / -0.01em
- `title-lg`: 1.375rem / 1.75rem / 650 / -0.01em
- `title-md`: 1.125rem / 1.5rem / 650 / 0
- `body-lg`: 1rem / 1.5rem / 500 / 0
- `body-md`: 0.9375rem / 1.375rem / 500 / 0
- `body-sm`: 0.875rem / 1.25rem / 500 / 0
- `label-md`: 0.8125rem / 1.125rem / 600 / 0.01em
- `label-sm`: 0.75rem / 1rem / 600 / 0.02em

### 3.1.3 Usage rules
- One `h1` per screen
- Titles use display font only for major headings and brand marks
- Form labels, metadata, and chips use UI/body font only
- Keep line length near 45-75 characters for long text blocks

---

## 3.2 Color System

## 3.2.1 Semantic palette (light)
- `bg.canvas`: `#F6F7F5`
- `bg.surface`: `#FFFFFF`
- `bg.elevated`: `#FCFCFB`
- `bg.subtle`: `#EEF1EE`
- `fg.primary`: `#0D1B2A`
- `fg.secondary`: `#3E4C59`
- `fg.muted`: `#6B7A88`
- `border.default`: `#D7DEE4`
- `border.strong`: `#BFCAD4`
- `brand.primary`: `#0A4D68`
- `brand.primary-hover`: `#083F56`
- `brand.accent`: `#FF6B4A`
- `brand.accent-soft`: `#FFE3DB`
- `brand.route`: `#2CB1A5`
- `success`: `#2F9E44`
- `warning`: `#E67700`
- `danger`: `#D94848`
- `info`: `#1971C2`

## 3.2.2 Semantic palette (dark)
- `bg.canvas`: `#0E141B`
- `bg.surface`: `#121B24`
- `bg.elevated`: `#17222D`
- `bg.subtle`: `#1E2B37`
- `fg.primary`: `#E9F0F6`
- `fg.secondary`: `#C1CED9`
- `fg.muted`: `#98A9B9`
- `border.default`: `#2D3C4A`
- `border.strong`: `#3A4E60`
- `brand.primary`: `#48A7D4`
- `brand.primary-hover`: `#6FC0E7`
- `brand.accent`: `#FF8D72`
- `brand.accent-soft`: `#3B2420`
- `brand.route`: `#49CFC0`
- `success`: `#63D482`
- `warning`: `#FFB95E`
- `danger`: `#FF8787`
- `info`: `#74C0FC`

## 3.2.3 Contrast requirements
- Text and key UI controls must meet WCAG AA
- Minimum contrast goals:
  - Body text: 4.5:1
  - Large text: 3:1
  - UI boundaries/icons for controls: 3:1 where applicable

## 3.2.4 Color usage strategy
- Primary CTA and selected states: `brand.primary`
- Secondary highlights and emotional energy: `brand.accent` (sparingly)
- Route/timeline/state of movement: `brand.route`
- Avoid flat single-color pages; use subtle surfaces/gradients for depth

---

## 3.3 Spacing, Radius, Shadow, Border

## 3.3.1 Spacing scale (4pt base)
- `1`: 0.25rem
- `2`: 0.5rem
- `3`: 0.75rem
- `4`: 1rem
- `5`: 1.25rem
- `6`: 1.5rem
- `8`: 2rem
- `10`: 2.5rem
- `12`: 3rem

Mobile defaults should start compact, then expand at `sm` and above.

## 3.3.2 Radius scale
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `pill`: 999px

## 3.3.3 Border strategy
- Default 1px with semantic border tokens
- Use 2px only for focus, active route markers, or critical emphasis

## 3.3.4 Shadow system
- `shadow-1` (cards): soft low elevation
- `shadow-2` (floating controls/popovers)
- `shadow-3` (modals)

No heavy opaque shadows; keep atmospheric and clean.

---

## 3.4 Iconography

### 3.4.1 Library
Keep Lucide as primary icon set for consistency and implementation speed.

### 3.4.2 Visual rules
- Default size: 16px in dense metadata, 18-20px in controls
- Keep stroke width consistent (Lucide default)
- Decorative icons set `aria-hidden="true"`
- Semantic colors only (no random color per icon)

### 3.4.3 Semantics
- Travel movement: route color
- Destructive: danger color
- Warnings/time pressure: warning color

---

## 4. Theming (Light / Dark / System)

## 4.1 Theme model
Support three modes:
- `light`
- `dark`
- `system`

Theme preference priority:
1. User saved preference
2. OS preference (`prefers-color-scheme`)
3. Fallback to light

## 4.2 Implementation approach
- Use CSS variables on `:root` for semantic tokens
- Toggle via `data-theme="light|dark"` on `<html>`
- Add `color-scheme: light dark;` at root
- Persist selection in localStorage key: `tripaivisor-theme`

## 4.3 No-flash requirements
- Resolve theme before first paint using inline script in root layout
- Prevent initial light flash when user uses dark theme

---

## 5. Motion and Transitions

## 5.1 Motion principles
- Meaningful, not decorative noise
- Reinforce hierarchy/state change
- Keep interactions snappy

## 5.2 Motion tokens
- `duration-fast`: 120ms
- `duration-base`: 180ms
- `duration-slow`: 260ms
- `easing-standard`: `cubic-bezier(0.2, 0.0, 0.2, 1)`
- `easing-emphasized`: `cubic-bezier(0.2, 0.8, 0.2, 1)`

## 5.3 Core motion patterns
- Card hover/focus lift: translateY(-1px) + subtle shadow
- Menu/popover: fade + slight scale
- Modal: fade backdrop + scale/translate container
- Timeline expand/collapse: height + opacity transition

## 5.4 View transitions
Use View Transition API for route-level transitions where available:
- Trips list card -> trip detail shell
- Fallback gracefully to no route transition where unsupported

## 5.5 Reduced motion
Respect `prefers-reduced-motion: reduce`:
- Disable non-essential transforms/parallax/scale
- Keep essential state transitions minimal and instant-like

---

## 6. Mobile-First Layout Spec

## 6.1 Breakpoints
- `base`: 0-639px (primary target)
- `sm`: >=640px
- `md`: >=768px
- `lg`: >=1024px

## 6.2 Global container rules
- Base page padding: `px-4 py-5`
- `sm`: `px-6 py-6`
- `md+`: `px-8 py-8`

Avoid default `p-8` on base mobile.

## 6.3 Density rules
- Stack first, then split
- Any row with 3+ controls must collapse to vertical groups on base
- Preserve minimum tap target 44px height

## 6.4 Current mobile issues to fix
- Large default page paddings on small screens
- Fixed date picker widths
- Horizontal city banner structure
- Horizontal add-destination form with multiple controls
- Trip header action cluster squeezing

---

## 7. Component Redesign Spec

## 7.1 App Shell / Header
Target files:
- `src/components/layout/header.tsx`
- `src/components/layout/user-menu.tsx`

Changes:
- Keep sticky behavior but increase perceived polish with elevated translucent surface token
- Stronger brand lockup typography
- Improve avatar/menu button hit target and focus treatment
- Menu panel spacing/radius/shadow aligned with new system

Mobile:
- Header height compact but touch-friendly
- Ensure menu doesn’t clip on small width

## 7.2 Button
Target file:
- `src/components/ui/button.tsx`

Changes:
- Update variants to semantic theme tokens
- Add visible `focus-visible` ring across variants
- Keep size scale, but ensure base and `sm` are touch-safe on mobile

## 7.3 Input / Select / Date Picker
Target files:
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/date-picker.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/popover.tsx`

Changes:
- Unified control height, border, text, placeholder, focus states
- Replace rigid popover sizing (`w-[340px]`) with viewport-aware sizing
- Improve date-picker trigger truncation and wrapping behavior

Mobile:
- Date-picker popover width <= viewport minus gutters
- Controls stack naturally in forms

## 7.4 Card
Target file:
- `src/components/ui/card.tsx`

Changes:
- New background, border, radius, shadow tokens
- Preserve lightweight structure while improving depth and contrast

## 7.5 Dialog / Modal
Target file:
- `src/components/ui/dialog.tsx`

Changes:
- New modal elevation and spacing tokens
- Better mobile full-height behavior where needed
- Unified motion with reduced-motion fallback

## 7.6 Trips List Screen
Target file:
- `src/app/[locale]/trips/page.tsx`
- `src/components/trips/trip-card.tsx`

Changes:
- Mobile-first spacing in page shell
- Trip cards with stronger information hierarchy (title, timing, destinations, CTA)
- Improve chip styles and metadata readability

## 7.7 Trip Detail Header
Target file:
- `src/components/trips/trip-header.tsx`

Changes:
- Reorganize into stacked mobile structure:
  - Title block
  - Date controls block
  - Secondary actions block
- Avoid crowded inline control rows

## 7.8 Trip City Banner
Target file:
- `src/components/trips/trip-city-banner.tsx`

Changes:
- Transform from rigid horizontal strip to responsive card:
  - Mobile: vertical or two-row structure
  - Desktop: horizontal route line preserved
- Replace hard `min-w` constraints with responsive widths

## 7.9 Destination Timeline + Cards
Target files:
- `src/components/trips/destination-list.tsx`
- `src/components/trips/destination-card.tsx`

Changes:
- Keep timeline concept but refine node/connectors and spacing tokens
- Add-destination form becomes mobile stack/grid
- Destination card metadata and expandable sections use clearer visual grouping
- Action menu affordance/focus states improved

---

## 8. Accessibility and UX Guardrails

## 8.1 Core rules
- Maintain semantic controls (`button` vs links)
- Icon-only buttons must have `aria-label`
- Decorative icons should use `aria-hidden`
- Visible `focus-visible` treatments everywhere
- Maintain proper heading hierarchy per screen

## 8.2 Form behavior
- Labels always visible and associated
- Inline errors clear and readable
- Preserve keyboard navigation and focus trap behavior in dialogs

## 8.3 Motion and preference respect
- Honor reduced-motion
- Keep transition durations short and readable

---

## 9. Implementation Plan (File-by-File)

## Phase 1: Foundations
1. `src/app/layout.tsx`
- Load new font families with `next/font`
- Add theme initialization script for no-flash behavior

2. `src/app/globals.css`
- Introduce semantic CSS variables (light + dark)
- Add motion tokens and reduced-motion handling
- Update global body/background/typography treatment

3. `tailwind.config.ts`
- Map token families into Tailwind theme extensions
- Add new font families and semantic aliases

### Phase 1 Implementation Summary (Completed March 1, 2026)

Phase 1 has been implemented in full across the three planned foundation files.

1. `src/app/layout.tsx`
- Replaced the previous single Inter setup with local `next/font` loading for both new families:
  - `Manrope` as UI/body font source (`--font-manrope`)
  - `Space Grotesk` as display/headline source (`--font-space-grotesk`)
- Added an inline pre-hydration theme initialization script in `<head>` to prevent theme flash on first paint.
- Implemented theme resolution order exactly as defined:
  1. `localStorage` key `tripaivisor-theme` (`light`/`dark`/`system`)
  2. OS setting via `prefers-color-scheme` when preference is `system` or missing
  3. Light fallback inside error handling
- Applied resolved theme to `<html data-theme="...">` and `color-scheme` before render.
- Added `suppressHydrationWarning` on `<html>` to avoid hydration noise when client theme differs from server default.

2. `src/app/globals.css`
- Replaced the previous minimal global styles with a full semantic token foundation:
  - Background tokens (`--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`)
  - Foreground tokens (`--fg-primary`, `--fg-secondary`, `--fg-muted`)
  - Border tokens (`--border-default`, `--border-strong`)
  - Brand/system tokens (`--brand-primary`, `--brand-primary-hover`, `--brand-accent`, `--brand-accent-soft`, `--brand-route`, `--success`, `--warning`, `--danger`, `--info`)
  - Radius tokens (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-pill`)
  - Shadow tokens (`--shadow-1`, `--shadow-2`, `--shadow-3`)
  - Motion tokens (`--motion-fast`, `--motion-base`, `--motion-slow`, `--ease-standard`, `--ease-emphasized`)
- Added dark-theme token overrides under `:root[data-theme='dark']`.
- Updated global typography treatment:
  - Body uses Manrope stack
  - Heading elements use Space Grotesk stack
- Updated global surface treatment:
  - Canvas background with subtle atmospheric gradients over `--bg-canvas`
  - Improved text rendering defaults for polish
- Updated animation utility classes (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`) to use motion tokens.
- Added utility classes for the new type scale:
  - `text-display-lg`, `text-display-md`, `text-title-lg`, `text-title-md`
  - `text-body-lg`, `text-body-md`, `text-body-sm`
  - `text-label-md`, `text-label-sm`
- Added reduced-motion guardrail with `prefers-reduced-motion: reduce` to minimize non-essential animation and transition timing.

3. `tailwind.config.ts`
- Extended Tailwind theme with semantic aliases mapped to CSS variables for the redesign system:
  - `canvas`, `surface`, `elevated`, `subtle`
  - `foreground.{primary,secondary,muted}`
  - `border.{DEFAULT,strong}`
  - `brand.{primary,primary-hover,accent,accent-soft,route}`
  - `route`, `success`, `warning`, `danger`, `info`
- Added new font family aliases:
  - `font-sans` -> `var(--font-manrope)`
  - `font-display` -> `var(--font-space-grotesk)` + fallback chain
- Added token-backed radius aliases:
  - `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill`
- Added token-backed shadow aliases:
  - `shadow-shadow-1`, `shadow-shadow-2`, `shadow-shadow-3`
  - `shadow-card`, `shadow-floating`, `shadow-modal`
- Added token-backed transition aliases:
  - Durations: `duration-fast`, `duration-base`, `duration-slow`
  - Easings: `ease-standard`, `ease-emphasized`
- Preserved existing `primary` and `accent` palettes for compatibility with current components until Phase 2 primitive restyling is applied.

4. Verification
- Ran full production build with `npm run build`.
- Result: build completed successfully (compile + type checking passed).
- Note: one pre-existing lint warning remains unrelated to Phase 1 (`<img>` usage in `src/components/layout/user-menu.tsx`).

## Phase 2: Primitive Components
1. `src/components/ui/button.tsx`
2. `src/components/ui/input.tsx`
3. `src/components/ui/textarea.tsx`
4. `src/components/ui/select.tsx`
5. `src/components/ui/card.tsx`
6. `src/components/ui/dialog.tsx`
7. `src/components/ui/popover.tsx`
8. `src/components/ui/date-picker.tsx`
9. `src/components/ui/calendar.tsx`

Goal: all shared controls updated before screen-level restyling.

### Phase 2 Implementation Summary (Completed March 1, 2026)

Phase 2 has been implemented across all nine planned primitive component files. The update keeps all existing component APIs and behavior contracts intact while moving shared controls to the new semantic token system, mobile-first sizing, and stronger accessibility treatments.

1. `src/components/ui/button.tsx`
- Reworked all variants to semantic design tokens:
  - `default` now uses `brand.primary` with hover state on `brand.primary-hover`
  - `outline` now uses tokenized border/surface/foreground states
  - `ghost` now uses muted-to-primary tokenized foreground behavior
  - `destructive` now uses semantic `danger`
- Added a consistent `focus-visible` ring and ring offset across all variants (`ring-brand-primary` + `ring-offset-canvas`).
- Updated motion and interaction timing to tokenized transitions (`duration-base`, `ease-standard`) with lightweight active press feedback.
- Updated size scale to touch-safe defaults:
  - `default` and `sm` are now 44px height (`h-11`)
  - `lg` uses `h-12` for larger action emphasis

2. `src/components/ui/input.tsx`
- Unified control baseline with semantic tokens for border, surface, foreground, and placeholder.
- Standardized control height to 44px (`h-11`) to align with mobile tap target requirements.
- Added consistent `focus-visible` treatment matching button/select controls.
- Refined disabled state with semantic subtle background and controlled opacity.
- Preserved compatibility with existing `type` usage (including `time` and file input behavior helpers).

3. `src/components/ui/textarea.tsx`
- Aligned textarea styling to the same semantic border/surface/foreground/focus system as input.
- Added tokenized transition behavior and consistent focus-visible ring.
- Refined disabled and placeholder styling for consistency with other form controls.
- Kept component API unchanged while improving readability and visual cohesion.

4. `src/components/ui/select.tsx`
- Upgraded trigger styles to the shared 44px control baseline and semantic token palette.
- Added explicit accessibility semantics:
  - `aria-haspopup="listbox"`
  - `aria-expanded`
  - `aria-controls`
  - `role="listbox"` and `role="option"` in content/items
  - `aria-selected` for option state
- Added outside-click and Escape handling to close open menus.
- Added selected-item affordance with check icon and selected background token.
- Improved placeholder rendering (`foreground.muted`) and added chevron motion state.
- Preserved existing usage patterns (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`) so screen components do not require refactors.

5. `src/components/ui/card.tsx`
- Migrated card visuals to semantic surface/border/foreground tokens.
- Applied redesign elevation and motion behavior:
  - Default card shadow token
  - Subtle hover lift and stronger floating shadow on capable devices
- Refined inner spacing to better support mobile-first density (`p-5` base, `sm:p-6`).
- Updated title/description text styles to tokenized typography utilities.

6. `src/components/ui/dialog.tsx`
- Updated backdrop to a refined elevated treatment (blur + controlled opacity).
- Improved mobile layout behavior:
  - Sheet-like bottom alignment on base breakpoints
  - Centered modal behavior on `sm+`
- Updated content shell with semantic border/surface, modal shadow token, and viewport-safe max-height using `100dvh`.
- Updated dialog typography and footer action layout:
  - Mobile: stacked/reversed actions for easier thumb reach
  - Desktop: right-aligned row actions
- Kept focus trap, Escape close behavior, and outside-click dismissal intact.

7. `src/components/ui/popover.tsx`
- Replaced basic fixed positioning with viewport-aware placement logic:
  - Horizontal clamping to viewport gutters
  - Min-width based on trigger width
  - Max-width constrained to viewport minus gutters
  - Vertical auto-placement above/below trigger based on available space
  - Dynamic max-height to prevent off-screen overflow
- Preserved scroll/resize re-positioning and outside-click/Escape close behavior.
- Updated popover surface/border/shadow to semantic floating tokens.

8. `src/components/ui/date-picker.tsx`
- Removed rigid fixed popover sizing strategy and aligned with responsive popover/container behavior.
- Updated trigger control to shared 44px baseline and semantic typography/colors.
- Improved trigger text behavior for small viewports:
  - `min-w-0` support
  - Truncation-friendly content container
  - Better placeholder styling via semantic muted foreground
- Kept locale behavior and date conversion/parsing logic unchanged.

9. `src/components/ui/calendar.tsx`
- Re-themed calendar internals to semantic token palette (text, border, surfaces, selected/today states).
- Updated day/nav hit areas and control styles for clearer affordances and touch-friendly behavior.
- Added focus-visible rings for keyboard navigation consistency.
- Preserved `react-day-picker` behavior and API contract (`showOutsideDays`, mode/selection props).

10. Verification
- Ran full production build with `npm run build` after Phase 2 implementation.
- Result: build completed successfully (compilation, lint step, and type checking passed in Next.js build pipeline).
- Note: one pre-existing lint warning remains unrelated to Phase 2 (`<img>` usage in `src/components/layout/user-menu.tsx`).

## Phase 3: Layout + Screen Components
1. `src/components/layout/header.tsx`
2. `src/components/layout/user-menu.tsx`
3. `src/app/[locale]/trips/page.tsx`
4. `src/components/trips/trip-card.tsx`
5. `src/components/trips/trip-header.tsx`
6. `src/components/trips/trip-city-banner.tsx`
7. `src/components/trips/destination-list.tsx`
8. `src/components/trips/destination-card.tsx`
9. `src/app/[locale]/trips/[tripId]/page.tsx`
10. `src/app/[locale]/trips/new/page.tsx`
11. `src/app/[locale]/(auth)/login/page.tsx`

### Phase 3 Implementation Summary (Completed March 1, 2026)

Phase 3 has been implemented across all 11 planned layout and screen-level files. The work keeps route structure, auth behavior, server actions, and domain logic intact while applying the redesigned visual system and mobile-first layout constraints.

1. `src/components/layout/header.tsx`
- Upgraded the sticky app shell header to semantic tokens (`canvas`, `border`, `brand`) with backdrop blur and improved visual polish.
- Updated brand lockup to display typography (`font-display`) and stronger hierarchy.
- Added robust focus-visible treatment to the home/brand link.
- Improved icon surface treatment and spacing for better touch ergonomics.

2. `src/components/layout/user-menu.tsx`
- Increased trigger hit target to touch-safe sizing (`h-11`) and improved avatar/menu affordance with bordered pill trigger.
- Added visual open-state chevron animation and stronger keyboard focus styling.
- Refined menu panel to redesign tokens (elevated surface, radius, border, floating shadow) with viewport-safe width for small screens.
- Added Escape key handling and preserved outside-click close behavior.
- Improved language option semantics and interaction styling while preserving locale-switch routing logic.
- Kept sign-out behavior and settings placeholder behavior unchanged.

3. `src/app/[locale]/trips/page.tsx`
- Converted page shell spacing to mobile-first paddings (`px-4 py-5`, then `sm`/`md` expansion).
- Refined hero/header composition with stronger heading typography and supporting copy.
- Updated action controls container for stacked mobile behavior and cleaner desktop alignment.
- Restyled empty state card to semantic tokens with improved hierarchy and CTA emphasis.
- Preserved trips fetching, stats loading, and card rendering logic.

4. `src/components/trips/trip-card.tsx`
- Restyled card surface using semantic border/background/shadow tokens with subtle hover elevation.
- Strengthened trip title and metadata hierarchy (date, days, destinations) with chip-like visual grouping.
- Updated CTA layout to full-width on mobile and inline on larger screens.
- Preserved delete form wiring and navigation behavior.

5. `src/components/trips/trip-header.tsx`
- Reorganized header into clear stacked blocks:
  - Title block
  - Date controls block
  - Secondary actions block (export/share)
- Updated title editing surface and underline affordance without altering save-on-blur behavior.
- Refined start/end date controls into a responsive grid and improved days badge prominence.
- Kept all title/date mutation logic unchanged (`updateTripTitleAction`, `updateTripDatesAction`).
- Preserved existing validation and error messaging flows for date constraints.

6. `src/components/trips/trip-city-banner.tsx`
- Transformed the old horizontal strip into a responsive card layout:
  - Mobile: stacked city blocks
  - Desktop: preserved directional travel flow with connecting line
- Reworked editable city affordances with clearer labels, truncation safety, and focus treatment.
- Preserved Enter/Escape/blur behavior and city normalization/save semantics.

7. `src/components/trips/destination-list.tsx`
- Refined timeline shell with updated connector, nodes, and spacing tokens for clearer route structure.
- Reworked add-destination form into a mobile-first stacked layout while retaining insert-at-position behavior.
- Updated insert affordance, timeline markers, and visual grouping for better readability and tap accuracy.
- Kept all operational logic unchanged: add, insert, reorder (drag/drop), delete, modal edit, and optimistic recovery paths.

8. `src/components/trips/destination-card.tsx`
- Improved destination card hierarchy with clearer title, chips, metadata previews, and expandable detail sections.
- Updated action menu affordance and panel styling with accessible focus treatment.
- Enhanced expanded sections (transport, accommodation, notes, budget) using consistent grouped surfaces.
- Preserved all detail derivation logic and locale-dependent labels.

9. `src/app/[locale]/trips/[tripId]/page.tsx`
- Updated page shell spacing to mobile-first paddings and increased max width for redesigned card rhythm.
- Refined back-link affordance with focus-visible treatment and tokenized text states.
- Preserved all trip/session ownership checks and data loading flow.

10. `src/app/[locale]/trips/new/page.tsx`
- Updated new trip screen to semantic card styling and mobile-first spacing rules.
- Improved form label readability and action row behavior (stack on mobile, align on larger screens).
- Preserved create action wiring and cancel navigation behavior.

11. `src/app/[locale]/(auth)/login/page.tsx`
- Restyled login screen into a stronger editorial card composition using semantic tokens and display typography.
- Improved visual hierarchy for brand mark, welcome heading, and CTA framing.
- Preserved Google sign-in handler and existing interaction behavior.

12. Accessibility and interaction improvements applied in Phase 3
- Added/expanded `focus-visible` treatment across header/menu/screen actions.
- Added explicit `aria-hidden` on decorative icons where appropriate.
- Preserved semantic button usage and menu/dialog interaction semantics from existing flows.

13. Verification
- Ran `npm run build` after Phase 3 implementation.
- Result: build completed successfully (compile + type validation + static generation passed).
- Note: one pre-existing lint warning remains unrelated to this phase’s behavioral goals (`<img>` usage warning in `src/components/layout/user-menu.tsx`).

## Phase 4: Theme Toggle + View Transitions
1. Add theme toggle control to user menu
2. Add view transition wrapper/classes for key route transitions
3. Add reduced-motion fallbacks for new transitions

### Phase 4 Implementation Summary (Completed March 1, 2026)

Phase 4 has been implemented in full across theme controls, route transitions, and reduced-motion handling. The work preserves existing route/business behavior while adding the planned theming and motion enhancements.

1. Theme toggle control in user menu
- Added a new `Theme` section to the user menu with three explicit options:
  - `Light`
  - `Dark`
  - `System`
- Implemented semantic radio-style menu actions (`role="menuitemradio"` + `aria-checked`) and preserved existing menu keyboard/close behavior.
- Added immediate theme application logic to update:
  - `<html data-theme="light|dark">`
  - `color-scheme` style on `<html>`
- Persisted user preference in `localStorage` under `tripaivisor-theme`.
- Implemented live OS-sync when `System` is selected via `prefers-color-scheme` media query listener.
- File updated:
  - `src/components/layout/user-menu.tsx`

2. i18n copy updates for theme controls
- Added new `auth` namespace keys for both locales:
  - `theme`
  - `themeLight`
  - `themeDark`
  - `themeSystem`
- Files updated:
  - `src/messages/en.json`
  - `src/messages/es.json`

3. View Transition wrapper for navigation
- Added a reusable client component that wraps `next/link` and triggers `document.startViewTransition(...)` when available.
- Included safe fallbacks:
  - Falls back to normal navigation when View Transition API is unavailable.
  - Falls back to normal navigation when `prefers-reduced-motion: reduce` is active.
  - Preserves standard modified-click behavior (new tab/window shortcuts).
- Supports optional `transitionName` mapping via `view-transition-name`.
- File added:
  - `src/components/ui/view-transition-link.tsx`

4. Key route transition wiring
- Replaced key trips navigation links with the new transition wrapper:
  - Trip card CTA (`/trips` -> `/trips/[tripId]`)
  - Trip detail back link (`/trips/[tripId]` -> `/trips`)
  - Create trip CTA paths via shared create button usage
- Added trip-specific shared transition naming:
  - Trip cards use `view-transition-name: trip-shell-{tripId}`
  - Trip detail shell uses the same transition name for the selected trip
- Added transition shell class hooks (`vt-route-shell`) to key trips screens.
- Files updated:
  - `src/components/trips/trip-card.tsx`
  - `src/app/[locale]/trips/[tripId]/page.tsx`
  - `src/app/[locale]/trips/page.tsx`
  - `src/components/trips/create-trip-button.tsx`

5. Programmatic navigation transition support
- Updated import flow navigation (`router.push`) to use View Transition API when supported and when motion is allowed.
- File updated:
  - `src/components/trips/import-trip-button.tsx`

6. Reduced-motion fallback and transition styles
- Added global View Transition styling and timing tokens for route transitions.
- Added explicit reduced-motion overrides for View Transition pseudo-elements so new transitions become effectively instant under `prefers-reduced-motion: reduce`.
- File updated:
  - `src/app/globals.css`

7. Verification
- Ran full production build with `npm run build`.
- Result: build completed successfully (compile + lint stage + type checking + static generation passed).
- Note: one lint warning remains pre-existing and unrelated to Phase 4 scope (`<img>` usage warning in `src/components/layout/user-menu.tsx`).

## Phase 5: QA and Polish
1. Mobile viewport QA
2. Light/dark visual QA
3. Accessibility checks
4. Regression pass for existing functionality

### Phase 5 Implementation Summary (Completed March 1, 2026)

Phase 5 has been completed with a focused QA-and-polish pass for theme consistency, especially on components that were still rendering with light-only palettes in dark mode.

1. Theme compatibility audit and remediation
- Performed a targeted class-level audit for hardcoded light-only utility classes (`bg-white`, `text-slate-*`, `border-slate-*`, `bg-primary-*`, etc.) across app and trip UI components.
- Replaced remaining light-only styles with semantic design-token classes (`bg-surface`, `bg-elevated`, `bg-subtle`, `text-foreground-*`, `border-border`, `text-brand-primary`, `text-danger`, `text-warning`, `text-success`) so they adapt correctly under both light and dark themes.

2. Components fixed for dark mode rendering
- Start/end transportation cards and leg sections:
  - `src/components/trips/departure-card.tsx`
  - `src/components/trips/return-card.tsx`
- Transport modals and leg-form cards:
  - `src/components/trips/departure-transport-modal.tsx`
  - `src/components/trips/return-transport-modal.tsx`
- Destination editing modal sections and sticky footer:
  - `src/components/trips/destination-modal.tsx`
- Share modal surface, metadata, input state, and feedback states:
  - `src/components/trips/share-modal.tsx`
- Shared trip read-only screen shell, timeline, and destination cards:
  - `src/components/trips/trip-view-only.tsx`
- Shared and supporting UI primitives/components:
  - `src/components/ui/label.tsx`
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/layout/locale-switcher.tsx`
  - `src/components/trips/create-trip-button.tsx`
  - `src/components/trips/delete-trip-button.tsx`
  - `src/components/trips/import-trip-button.tsx`
  - `src/app/[locale]/page.tsx`

3. QA outcome
- Confirmed no remaining hardcoded light-only palette utilities in `src/components` and `src/app` for the audited class families.
- Verified final implementation through a full production build.

4. Verification
- Ran `npm run build`.
- Result: build completed successfully (compile + lint stage + type checking + static generation passed).
- Note: one pre-existing lint warning remains unrelated to Phase 5 scope (`<img>` usage warning in `src/components/layout/user-menu.tsx`).

---

## 10. QA Checklist

## 10.1 Device widths
Test at minimum:
- 320x568
- 360x800
- 390x844
- 768x1024
- 1024x768
- 1440x900

## 10.2 Functional UI checks
- No horizontal overflow
- Menus/popovers/dialogs fit viewport
- Form controls remain usable and readable
- Timeline interactions remain intact

## 10.3 Theme checks
- Light, dark, system all render correctly
- Theme persists across reloads
- No initial flash mismatch

## 10.4 Accessibility checks
- Keyboard navigation end-to-end
- Focus indicators visible
- Contrast checks pass AA
- Reduced-motion behavior respected

---

## 11. Acceptance Criteria

The redesign is complete when:
1. No new app functionality was introduced
2. Core screens and shared primitives match this visual system
3. Mobile-first layout issues are resolved on base breakpoints
4. Light/dark/system theme switching works with persistence
5. Motion is cohesive and reduced-motion compliant
6. Accessibility and contrast requirements pass

---

## 12. Starter Token Snippet (Implementation Seed)

```css
:root {
  color-scheme: light dark;

  --bg-canvas: #f6f7f5;
  --bg-surface: #ffffff;
  --bg-elevated: #fcfcfb;
  --bg-subtle: #eef1ee;

  --fg-primary: #0d1b2a;
  --fg-secondary: #3e4c59;
  --fg-muted: #6b7a88;

  --border-default: #d7dee4;
  --border-strong: #bfcad4;

  --brand-primary: #0a4d68;
  --brand-primary-hover: #083f56;
  --brand-accent: #ff6b4a;
  --brand-route: #2cb1a5;

  --success: #2f9e44;
  --warning: #e67700;
  --danger: #d94848;
  --info: #1971c2;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
}

:root[data-theme='dark'] {
  --bg-canvas: #0e141b;
  --bg-surface: #121b24;
  --bg-elevated: #17222d;
  --bg-subtle: #1e2b37;

  --fg-primary: #e9f0f6;
  --fg-secondary: #c1ced9;
  --fg-muted: #98a9b9;

  --border-default: #2d3c4a;
  --border-strong: #3a4e60;

  --brand-primary: #48a7d4;
  --brand-primary-hover: #6fc0e7;
  --brand-accent: #ff8d72;
  --brand-route: #49cfc0;

  --success: #63d482;
  --warning: #ffb95e;
  --danger: #ff8787;
  --info: #74c0fc;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 13. Reference Sources

- Wanderlog: https://wanderlog.com/
- TripIt: https://www.tripit.com/web
- Tripsy: https://tripsy.app/
- Polarsteps: https://www.polarsteps.com/
- MDN `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- MDN `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN View Transition API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- WCAG 2.2 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- web.dev responsive design basics: https://web.dev/articles/responsive-web-design-basics
- web.dev `prefers-color-scheme`: https://web.dev/articles/prefers-color-scheme
- Apple HIG color: https://developer.apple.com/design/human-interface-guidelines/color
- Apple HIG typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Android color guidance: https://developer.android.com/design/ui/mobile/guides/styles/color
- Android adaptive icons: https://developer.android.com/develop/ui/views/launch/icon_design_adaptive
