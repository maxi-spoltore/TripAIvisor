# Performance Optimization Spec

Baseline build (2026-03-06):

| Route                        | Page JS  | First Load JS |
|------------------------------|----------|---------------|
| `/[locale]/trips/[tripId]`   | 61.9 kB  | 191 kB        |
| `/[locale]/trips`            | 3.73 kB  | 132 kB        |
| `/[locale]/login`            | 2.19 kB  | 121 kB        |
| Shared by all                | --       | 87.3 kB       |

---

## 1. Remove unused font files

**Problem:** `src/app/fonts/` contains 76 files totaling 21 MB. Only two variable font files are actually loaded in `src/app/layout.tsx`:
- `Manrope/Manrope-VariableFont_wght.ttf` (164 KB)
- `Space_Grotesk/SpaceGrotesk-VariableFont_wght.ttf` (132 KB)

Everything else is dead weight:
- `src/app/fonts/inter/` -- entire directory (20 MB, 54+ files). Never imported anywhere.
- `src/app/fonts/Manrope/static/` -- 7 static weight files (672 KB). Duplicated by the variable font.
- `src/app/fonts/Space_Grotesk/static/` -- 5 static weight files (440 KB). Duplicated by the variable font.

**Action:**
1. Delete `src/app/fonts/inter/` directory entirely.
2. Delete `src/app/fonts/Manrope/static/` directory.
3. Delete `src/app/fonts/Space_Grotesk/static/` directory.
4. Keep only the two variable font `.ttf` files, `OFL.txt`, and `README.txt` license files.

**Verify:** `du -sh src/app/fonts/` should drop from 21 MB to ~300 KB. Build still succeeds.

---

## 2. Convert font files from TTF to WOFF2

**Problem:** The two variable fonts are served as `.ttf`. WOFF2 is ~30-50% smaller with identical browser support (all modern browsers since 2015).

**Action:**
1. Convert `Manrope-VariableFont_wght.ttf` to `Manrope-VariableFont_wght.woff2` (use `woff2_compress` or an online converter).
2. Convert `SpaceGrotesk-VariableFont_wght.ttf` to `SpaceGrotesk-VariableFont_wght.woff2`.
3. Update `src/app/layout.tsx` font declarations to reference `.woff2` files.

**Verify:** Font files should be roughly 90-100 KB each (down from 132-164 KB). Fonts render correctly in browser.

---

## 3. Use `next/image` instead of `<img>` in user-menu

**Problem:** `src/components/layout/user-menu.tsx:164` uses a raw `<img>` tag for the user avatar. This bypasses Next.js image optimization (lazy loading, sizing, format negotiation, LCP optimization).

**Action:**
1. Import `Image` from `next/image`.
2. Replace the `<img>` tag at line 164 with:
   ```tsx
   <Image
     alt={userName ?? 'User'}
     src={userImage}
     width={32}
     height={32}
     className="block h-8 w-8 rounded-full object-cover"
   />
   ```
3. Since `userImage` is an external URL (auth provider avatar), add the relevant domain(s) to `next.config.mjs` `images.remotePatterns`.

**Verify:** ESLint warning `@next/next/no-img-element` disappears from build output. Avatar still renders correctly.

---

## 4. Dynamic import for DestinationModal

**Problem:** `DestinationModal` (818 lines, `'use client'`) is always bundled in the trip detail page JS (61.9 kB), but users only open it when editing a destination. It imports heavy dependencies: `@radix-ui/react-dialog`, `@radix-ui/react-select`, and several UI components.

**Action:**
1. In `src/components/trips/destination-list.tsx`, replace the static import:
   ```tsx
   // Before
   import { DestinationModal, type DestinationModalSubmitInput } from './destination-modal';
   ```
   with a dynamic import:
   ```tsx
   import dynamic from 'next/dynamic';
   import type { DestinationModalSubmitInput } from './destination-modal';
   const DestinationModal = dynamic(() =>
     import('./destination-modal').then((mod) => ({ default: mod.DestinationModal }))
   );
   ```
2. The `type` import stays static (types are erased at build time).

**Verify:** Run `next build` and compare the trip detail page JS size. The page-specific JS should decrease since the modal code is split into a separate chunk loaded on demand. The modal still opens and functions correctly when editing a destination.

---

## 5. Wrap DestinationCard in React.memo

**Problem:** `src/components/trips/destination-card.tsx` exports `DestinationCard` without memoization. In `destination-list.tsx`, the parent re-renders on every state change (expand/collapse, menu open, drag state), causing all cards to re-render even when their props haven't changed.

**Action:**
1. In `src/components/trips/destination-card.tsx`, wrap the export with `memo`:
   ```tsx
   import { memo } from 'react';
   // ... existing code ...
   export const DestinationCard = memo(function DestinationCard({ ... }: DestinationCardProps) {
     // ... existing body ...
   });
   ```
2. In `destination-list.tsx`, stabilize the callback props passed to `DestinationCard` using `useCallback`:
   - `onDelete` (currently: `() => handleRequestDeleteDestination(destination.destination_id)`)
   - `onEdit` (currently: `() => handleOpenModal(destination.destination_id)`)
   - `onToggle` (currently: `() => handleToggleCard(destination.destination_id)`)

   These are created inline inside the `.map()` loop, so `memo` won't help unless the callbacks are stabilized. Wrap `handleRequestDeleteDestination`, `handleOpenModal`, and `handleToggleCard` with `useCallback`:
   ```tsx
   const handleToggleCard = useCallback((destinationId: number) => {
     dispatch({ type: 'TOGGLE_CARD', destinationId });
   }, []);

   const handleOpenModal = useCallback((destinationId: number) => {
     dispatch({ type: 'OPEN_EDIT', destinationId });
   }, []);

   const handleRequestDeleteDestination = useCallback((destinationId: number) => {
     dispatch({ type: 'REQUEST_DELETE', destinationId });
   }, []);
   ```
   Then update `DestinationCard` to accept `destinationId` and call the callbacks with it internally, instead of the parent wrapping them in closures:
   ```tsx
   // In DestinationCard props, change:
   onDelete: () => void;   -->  onDelete: (id: number) => void;
   onEdit: () => void;     -->  onEdit: (id: number) => void;
   onToggle: () => void;   -->  onToggle: (id: number) => void;
   ```
   And inside DestinationCard, call `onDelete(destination.destination_id)` etc.

**Verify:** With React DevTools Profiler, expanding/collapsing one card should not trigger re-renders on sibling cards.

---

## 6. Delete orphaned travel-planner.tsx

**Problem:** `travel-planner.tsx` at the project root is a 1,383-line legacy monolithic component. It is not imported by any file in `src/`. It predates the current component architecture and serves no purpose.

**Action:**
1. Confirm it's not imported: `grep -r "travel-planner" src/` should return nothing.
2. Delete `travel-planner.tsx` from the project root.

**Verify:** Build succeeds. No runtime errors.

---

## Verification checklist

After all changes:

1. `next build` succeeds with no new warnings
2. `@next/next/no-img-element` ESLint warning is gone
3. `du -sh src/app/fonts/` reports ~300 KB (down from 21 MB)
4. Trip detail page (`/[locale]/trips/[tripId]`) First Load JS is measurably lower than 191 kB
5. Fonts render correctly (Manrope for body, Space Grotesk for display)
6. User avatar displays correctly in the header menu
7. DestinationModal opens and saves correctly (dynamic import doesn't break behavior)
8. Expanding/collapsing destination cards is responsive; sibling cards don't re-render
9. `travel-planner.tsx` no longer exists at the project root
10. No files in `src/app/fonts/inter/`, `src/app/fonts/Manrope/static/`, or `src/app/fonts/Space_Grotesk/static/`

---

## Implementation summary (2026-03-06) - Points 3, 4, and 5

### Point 3 - `next/image` for user avatar (completed)

**Files changed:**
- `src/components/layout/user-menu.tsx`
- `next.config.mjs`

**What was implemented:**
1. Replaced the raw `<img>` avatar in `UserMenu` with `next/image`:
   - Imported `Image` from `next/image`.
   - Added explicit `width={32}` and `height={32}`.
   - Kept existing classes and fallback behavior unchanged.
2. Added remote image configuration in `next.config.mjs`:
   - `images.remotePatterns` now allows `https://lh3.googleusercontent.com` (Google auth profile avatars).

**Validation:**
- `npm run lint` reports no warnings or errors.
- `@next/next/no-img-element` warning is no longer present.
- `npm run build` succeeds.

### Point 4 - Dynamic import for `DestinationModal` (completed)

**File changed:**
- `src/components/trips/destination-list.tsx`

**What was implemented:**
1. Replaced static modal import with dynamic import:
   - `import dynamic from 'next/dynamic'`
   - `const DestinationModal = dynamic(() => import('./destination-modal').then((mod) => mod.DestinationModal));`
2. Kept the type import static:
   - `import type { DestinationModalSubmitInput } from './destination-modal';`
3. Deferred modal chunk loading until actually needed:
   - `DestinationModal` is now only rendered when `editingDestination` exists, instead of always mounting it with `open={false}`.

**Validation:**
- `npm run build` succeeds.
- Trip detail route bundle decreased:
  - Page JS: `61.9 kB` -> `57.5 kB`
  - First Load JS: `191 kB` -> `186 kB`

### Point 5 - Memoize `DestinationCard` and stabilize callbacks (completed)

**Files changed:**
- `src/components/trips/destination-card.tsx`
- `src/components/trips/destination-list.tsx`

**What was implemented:**
1. Wrapped `DestinationCard` with `React.memo`:
   - `export const DestinationCard = memo(function DestinationCard(...) { ... });`
2. Updated callback prop signatures to avoid inline closures in parent `.map()`:
   - `onDelete`, `onEdit`, `onToggle` now receive `destinationId`.
3. Stabilized parent handlers with `useCallback`:
   - `handleRequestDeleteDestination`
   - `handleOpenModal`
   - `handleToggleCard`
   - Also stabilized `handleDeleteDestination` and `handleConfirmDeleteDestination` to keep handler graph consistent.
4. Improved menu-related prop stability:
   - Replaced `openMenuId` card prop with primitive `isMenuOpen` boolean per card.
   - This reduces avoidable sibling re-renders when toggling action menus.

**Validation:**
- `npm run lint` reports no warnings or errors.
- `npm run build` succeeds with type checks passing.

### Build validation run

Commands executed:
1. `npm run lint`
2. `npm run build`

Result:
- Both commands completed successfully.
- No new build errors were introduced.
- Existing non-blocking Next.js cache warnings from `next-intl` parsing (`import(t)`) still appear during build and were not introduced by these changes.
