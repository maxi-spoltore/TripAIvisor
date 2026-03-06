# Modal Migration to shadcn Dialog — Spec

> Depends on: `SHADCN_MIGRATION_SPEC.md` Phase 2, Step 6 (Dialog migrated to shadcn/Radix).
> This spec covers the four modals that were marked "out of scope" in that document.

---

## Implementation Summary (Completed March 6, 2026)

This migration has been implemented and validated at compile/type-check level.

### Phase A & B — Transport Modals (Verify-only)

- `src/components/trips/departure-transport-modal.tsx`
- `src/components/trips/return-transport-modal.tsx`

Outcome:

- No structural changes were required. Both modals were already correctly using:
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
  - controlled `open` + `onOpenChange` with pending-state close guard
- Existing class overrides (`max-w-2xl`, mobile fullscreen classes) remain compatible with the current Radix-based `DialogContent`.
- Existing custom `SelectTrigger` display content (icon + label span) was kept as-is; no type/build issues were introduced.

### Phase C — ShareModal Migration (Implemented)

File updated: `src/components/trips/share-modal.tsx`

Completed changes:

- Replaced custom overlay/container markup with Dialog composition:
  - `Dialog`
  - `DialogContent`
  - `DialogHeader`
  - `DialogTitle`
  - `DialogDescription`
  - `DialogFooter`
- Removed manual overlay infrastructure:
  - scroll lock effect
  - Escape keydown listener effect
  - click-outside + stopPropagation wrapper divs
  - `if (!open) return null` gate
- Preserved business logic and UX:
  - share-link generation flow
  - clipboard copy flow
  - copied state feedback
  - error handling/messages
  - pending-state close lock via:
    - `onOpenChange={(nextOpen) => { if (!nextOpen && !isPending) onClose(); }}`

### Phase D — DestinationModal Migration (Implemented)

File updated: `src/components/trips/destination-modal.tsx`

Completed changes:

- Replaced custom overlay/container with Dialog composition:
  - `Dialog`
  - `DialogContent` (customized with `p-0`, `flex-col`, `overflow-hidden`)
  - `DialogHeader`
  - `DialogTitle`
  - `DialogFooter`
- Removed manual overlay infrastructure:
  - scroll lock effect
  - Escape keydown listener effect
  - click-outside + stopPropagation wrapper divs
- Preserved the original 3-part modal layout:
  - fixed header with border
  - scrollable form body (`flex-1 overflow-y-auto`)
  - sticky footer with border and action buttons
- Preserved all destination editing behavior:
  - stopover toggle and duration behavior
  - transport/accommodation/additional collapsible sections
  - all field bindings and validation
  - save/cancel behavior and pending states
  - pending-state close lock in `onOpenChange`

Implementation note:

- The destination header close button (`X`) was intentionally kept.
- Reason: current `src/components/ui/dialog.tsx` `DialogContent` does not render a built-in close button, so removing the custom button would reduce existing affordance.

### Validation Results

Executed after migration:

- `npm run lint` -> passed
  - unchanged pre-existing warning: `src/components/layout/user-menu.tsx` (`@next/next/no-img-element`)
- `npm run build` -> passed
  - production compile, lint, and type checking completed successfully

### Delivery Summary

- ShareModal and DestinationModal now rely on the centralized Radix/shadcn Dialog primitives instead of duplicated custom overlay logic.
- Departure/Return transport modals remain structurally unchanged and compatible with the migrated Dialog API.
- Manual browser checklist items in this spec remain recommended for interactive QA (focus return, full keyboard traversal, and mobile interaction feel), but no compile or type regressions remain.

---

## Current State Analysis

### Modal Inventory

| Modal | Overlay implementation | Uses `Dialog` from `ui/dialog`? | Lines |
|-------|----------------------|-------------------------------|-------|
| `ShareModal` | Custom (own fixed overlay, manual Escape, manual scroll lock, manual click-outside) | No | ~155 |
| `DestinationModal` | Custom (own fixed overlay, manual Escape, manual scroll lock, manual click-outside) | No | ~849 |
| `DepartureTransportModal` | Already uses `Dialog` + `DialogContent/Header/Footer/Title/Description` | Yes | ~602 |
| `ReturnTransportModal` | Already uses `Dialog` + `DialogContent/Header/Footer/Title/Description` | Yes | ~604 |

### Key Finding

**DepartureTransportModal and ReturnTransportModal already use the custom Dialog component.** Once the base Dialog is migrated to shadcn (Phase 2, Step 6 of the main spec), these two modals will automatically work with the new Radix-powered Dialog — zero structural changes needed. They only need import verification and minor API adjustments if the shadcn Dialog's compound component pattern differs.

The real migration work is on **ShareModal** and **DestinationModal**, which each roll their own overlay infrastructure.

---

## What Gets Removed Per Modal

### ShareModal — Custom overlay code to remove

1. **Scroll lock effect** (lines 36-44): `document.body.style.overflow = 'hidden'` — Radix Dialog handles this automatically.
2. **Escape key handler** (lines 46-59): manual `keydown` listener — Radix Dialog handles this automatically.
3. **Overlay div with click-to-dismiss** (lines 92-100): `fixed inset-0 z-50 ... onClick={onClose}` — replaced by `DialogOverlay`.
4. **Content div with stopPropagation** (lines 101-104): `onClick={(event) => event.stopPropagation()}` — Radix handles overlay vs content click discrimination.
5. **Conditional return** (lines 88-90): `if (!open) return null` — Radix Dialog controls mount/unmount via `open` prop.

**What stays untouched**: All business logic (generate link, copy to clipboard, error states, pending states), all UI content inside the modal, all state management.

### DestinationModal — Custom overlay code to remove

1. **Scroll lock effect** (lines 216-227): same pattern as ShareModal.
2. **Escape key handler** (lines 201-214): same pattern, with `isPending` guard.
3. **Overlay div with click-to-dismiss** (lines 327-335): same pattern, with `isPending` guard.
4. **Content div with stopPropagation** (lines 336-339): same pattern.
5. **Conditional return** (lines 272-274): `if (!open || !destination || !formState) return null`.

**What stays untouched**: All form state management (~100 lines), validation logic, submit handler, collapsible sections, all field bindings, all helper functions (`toInputValue`, `toNullable`, `hasTransportContent`, `hasAccommodationContent`, etc.).

---

## Restructuring Details

### ShareModal

**Current props**:
```ts
type ShareModalProps = {
  locale: string;
  tripId: number;
  open: boolean;
  onClose: () => void;
};
```

**Change**: `onClose` maps to Dialog's `onOpenChange`. The prop stays as `onClose` in the component's public API — internally we wire it:

```tsx
<Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
```

**Current structure** (simplified):
```
<div overlay onClick={onClose}>        ← REMOVE
  <div content stopPropagation>        ← REPLACE with DialogContent
    <div header>                       ← REPLACE with DialogHeader
      <h2 icon + title>               ← REPLACE with DialogTitle
      <p description>                  ← REPLACE with DialogDescription
    </div>
    {content: generate/copy link}      ← KEEP as-is
    {error message}                    ← KEEP as-is
    <div footer>                       ← REPLACE with DialogFooter
      <Button close>                   ← KEEP as-is
    </div>
  </div>
</div>
```

**New structure**:
```
<Dialog open={open} onOpenChange={...}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle>
        <Share2 icon /> {title}
      </DialogTitle>
      <DialogDescription>{viewOnly text}</DialogDescription>
    </DialogHeader>
    {content: generate/copy link}      ← unchanged
    {error message}                    ← unchanged
    <DialogFooter>
      <Button close>                   ← unchanged
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Removed effects**: 3 `useEffect` hooks (scroll lock, Escape handler, state reset on close). The state reset effect (`setCopied(false)` etc. when `open` flips to false) can stay — it's business logic, not overlay logic. Or it can be moved to `onOpenChange` callback.

**Lines removed**: ~30 lines of overlay infrastructure.
**Lines added**: ~10 lines of Dialog/DialogContent/DialogHeader wrapping.
**Net**: ~20 lines smaller.

**Risk**: The `isPending` guard on dismiss (don't close while generating link) needs to be preserved. With Radix Dialog, this is done via:
```tsx
onOpenChange={(nextOpen) => { if (!nextOpen && !isPending) onClose(); }}
```
This also covers Escape and overlay click — Radix calls `onOpenChange(false)` for both, so the guard works uniformly.

---

### DestinationModal

This is the complex one. It has a custom layout that diverges from the standard Dialog pattern.

**Current props**:
```ts
type DestinationModalProps = {
  locale: string;
  destination: DestinationWithRelations | null;
  open: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onSave: (payload: DestinationModalSubmitInput) => Promise<void> | void;
};
```

**Change**: `onCancel` maps to Dialog's `onOpenChange`. Same pattern as ShareModal.

**Current structure** (simplified):
```
<div overlay onClick={onCancel}>                          ← REMOVE
  <div content stopPropagation                            ← REPLACE with DialogContent
       max-h-[85vh] max-w-2xl flex-col overflow-hidden
       max-sm:h-screen max-sm:max-h-screen max-sm:rounded-none>
    <div header border-b p-6>                             ← REPLACE with DialogHeader
      <h2>"Edit — {city}"</h2>                            ← REPLACE with DialogTitle
      <button X close>                                    ← REMOVE (shadcn DialogContent has built-in X)
    </div>
    <div flex-1 overflow-y-auto p-6>                      ← KEEP (scrollable body)
      {basic fields}                                      ← KEEP
      {transport collapsible section}                     ← KEEP
      {accommodation collapsible section}                 ← KEEP
      {additional collapsible section}                    ← KEEP
      {error message}                                     ← KEEP
    </div>
    <div sticky bottom-0 border-t bg-surface p-4>        ← REPLACE with DialogFooter
      <Button save> <Button cancel>                       ← KEEP
    </div>
  </div>
</div>
```

**Layout challenge**: The current modal has a 3-part vertical layout:
1. Fixed header with border-bottom
2. Scrollable content area (`flex-1 overflow-y-auto`)
3. Sticky footer with border-top

This is more complex than a standard Dialog (which just has a single scrollable container). shadcn's `DialogContent` applies its own sizing/overflow. We need to customize `DialogContent` classes to support this layout.

**New structure**:
```
<Dialog open={open} onOpenChange={...}>
  <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-0
                             max-sm:h-screen max-sm:max-h-screen max-sm:rounded-none">
    <DialogHeader className="border-b border-border px-6 py-5">
      <DialogTitle>"Edit — {city}"</DialogTitle>
    </DialogHeader>
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      {basic fields}                                      ← unchanged
      {transport collapsible section}                     ← unchanged
      {accommodation collapsible section}                 ← unchanged
      {additional collapsible section}                    ← unchanged
      {error message}                                     ← unchanged
    </div>
    <DialogFooter className="sticky bottom-0 border-t border-border bg-surface p-4">
      <Button save> <Button cancel>                       ← unchanged
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Key decisions**:

1. **`p-0` on DialogContent**: The default shadcn DialogContent has padding. We override with `p-0` and apply padding individually to header/body/footer to support the divided layout.

2. **Close button**: shadcn's DialogContent includes a built-in X close button (rendered via `DialogPrimitive.Close`). This replaces the custom close button in the header. If the positioning doesn't match, we can hide the default one (`hideCloseButton` or `[&>button.absolute]:hidden`) and keep the custom one. But the default should work fine.

3. **Mobile full-screen**: The `max-sm:h-screen max-sm:max-h-screen max-sm:rounded-none` classes on DialogContent handle this. Radix Dialog renders content in a portal with fixed positioning, so this approach works.

4. **`isPending` dismiss guard**: Same pattern as ShareModal — handled in `onOpenChange`.

5. **Conditional rendering** (`if (!destination || !formState) return null`): This guard currently prevents the entire modal from rendering. With Radix Dialog, the `open` prop controls visibility. But we still need the `destination`/`formState` guard for the form content. Solution: keep the Dialog wrapper always rendered (Radix handles mount/unmount via `open`), but inside DialogContent, conditionally render the form. Or, keep the early return for `destination === null` since it means there's nothing to edit — the Dialog can still be closed properly.

**Removed effects**: 3 `useEffect` hooks (scroll lock, Escape handler are removed; state init effect stays — it's business logic).
**Lines removed**: ~25 lines of overlay infrastructure.
**Lines added**: ~8 lines of Dialog wrapping.
**Net**: ~17 lines smaller.

---

### DepartureTransportModal & ReturnTransportModal

**Current state**: Already use `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` from `@/components/ui/dialog`.

**After base Dialog migrates to shadcn (Step 6 of main spec)**:

These modals need **zero structural changes**. The imports point to the same path (`@/components/ui/dialog`), and the API is the same (`open`, `onOpenChange`, compound children pattern).

**Potential minor adjustments**:

1. **`DialogContent` className overrides**: Both modals pass `className="max-h-[85vh] max-w-2xl overflow-y-auto max-sm:h-screen max-sm:max-h-screen max-sm:rounded-none"`. shadcn's DialogContent has default sizing (`max-w-lg`). Since the modals override with `max-w-2xl`, this works — `twMerge` will resolve the conflict in favor of the consumer's class.

2. **`SelectTrigger` without `SelectValue`**: Both modals render a custom `<span>` inside `SelectTrigger` instead of `SelectValue`. With shadcn's Radix Select, `SelectTrigger` expects a `SelectValue` child for the display. Need to verify this pattern still works or adjust to use `SelectValue` with a `placeholder` prop + custom rendering.

3. **Close behavior**: Both modals use `onOpenChange={(nextOpen) => { if (!nextOpen && !isPending) onCancel(); }}`. This is standard Radix Dialog behavior — no change needed.

**Action**: Verify after Dialog and Select migrations. Fix if anything breaks. No proactive restructuring.

---

## Migration Order

This work happens AFTER the main shadcn migration spec Phase 2 (Steps 6-9):

| Step | Modal | Effort | Risk |
|------|-------|--------|------|
| A | DepartureTransportModal | Verify-only | Low — already uses Dialog. Just confirm it works after base Dialog migrates. |
| B | ReturnTransportModal | Verify-only | Low — same as above. |
| C | ShareModal | Small refactor | Low — simple modal, straightforward Dialog wrapping. |
| D | DestinationModal | Medium refactor | Medium — complex layout (header/scroll/sticky-footer), mobile full-screen, conditional rendering. |

**Recommended sequence**: A, B first (quick verification), then C (simple win), then D (needs care).

---

## Detailed Steps

### Step A & B: Verify Transport Modals

1. Open trip detail page with departure and return transport configured.
2. Click "Edit" on departure card → DepartureTransportModal opens.
3. Verify: opens with animation, Escape closes, overlay click closes, form fields work, Select dropdowns work, leg management (add/remove/revert) works, submit works.
4. Repeat for ReturnTransportModal.
5. Verify mobile: modal goes full-screen, scrolls properly, footer accessible.
6. If something breaks, check:
   - Dialog's `onOpenChange` callback shape matches what the modal expects.
   - DialogContent accepts and merges className overrides correctly.
   - Select API compatibility (see note about SelectTrigger children).

### Step C: Migrate ShareModal

1. Remove the 3 infrastructure `useEffect` hooks (scroll lock, Escape, cleanup — but keep the state-reset-on-close effect).
2. Remove the outer overlay `<div>` and inner content `<div>`.
3. Wrap with `<Dialog open={open} onOpenChange={...}>`.
4. Replace header markup with `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>`.
5. Replace footer `<div>` with `<DialogFooter>`.
6. Remove `if (!open) return null` — Dialog handles visibility.
7. Move `isPending` dismiss guard into `onOpenChange`.
8. Verify: share flow (generate link → copy → close), pending state blocks dismiss, Escape works, overlay click works.

### Step D: Migrate DestinationModal

1. Remove the 2 infrastructure `useEffect` hooks (scroll lock, Escape).
2. Remove the outer overlay `<div>` and inner content `<div>`.
3. Wrap with `<Dialog open={open} onOpenChange={...}>`.
4. Add `<DialogContent>` with `p-0` and flex column layout + mobile overrides.
5. Replace header div with `<DialogHeader>` (keep border-b styling via className).
6. Remove the custom X close button (shadcn provides one).
7. Keep the scrollable middle section as a plain `<div>`.
8. Replace footer div with `<DialogFooter>` (keep sticky + border-t styling via className).
9. Handle conditional rendering: keep the `if (!destination || !formState) return null` guard, but move it INSIDE the Dialog or wrap the Dialog with `open={open && !!destination}`.
10. Move `isPending` dismiss guard into `onOpenChange`.
11. Verify all interactions:
    - Stopover checkbox toggle
    - City/duration fields
    - Transport section expand/collapse + all sub-fields + Select dropdown
    - Accommodation section expand/collapse + all sub-fields
    - Additional section expand/collapse + notes textarea + budget
    - Validation errors display
    - Save (with pending spinner) and Cancel
    - Mobile: full-screen, scroll, sticky footer visible
    - Keyboard: Tab through fields, Escape closes (when not pending)

---

## Risks & Mitigations

### 1. DestinationModal scrollable body + sticky footer

**Risk**: Radix Dialog's content container may interfere with the `flex-col` + `overflow-hidden` + `flex-1 overflow-y-auto` pattern.

**Mitigation**: Override DialogContent's default styles with `p-0` and `overflow-hidden` (not `overflow-y-auto` on the outer container — only on the inner scroll div). Test on both desktop and mobile.

### 2. DestinationModal conditional rendering

**Risk**: The modal currently does `if (!open || !destination || !formState) return null`, returning nothing. With Radix Dialog, the root `<Dialog open={open}>` should always render (Radix needs it to manage state). If we return null before Dialog renders, Radix loses its internal state.

**Mitigation**: Always render the `<Dialog>` wrapper. Inside `DialogContent`, conditionally render the form or show nothing. Alternatively, use `open={open && destination !== null}` to tie Dialog's open state to both conditions.

### 3. Close button conflict in DestinationModal

**Risk**: shadcn DialogContent renders an X close button by default (absolute top-right). The current DestinationModal has its own X button in the header row. Having two close buttons would be confusing.

**Mitigation**: Remove the custom X button and rely on shadcn's built-in one. If the positioning doesn't look right with the `p-0` layout, hide the default one with `[&>button[class*="absolute"]]:hidden` and keep the custom one. Test both approaches and pick the cleaner one.

### 4. Focus management in nested contexts

**Risk**: DestinationModal is opened from DestinationList, which may have its own focus context. Radix Dialog grabs focus on mount and returns it on unmount. If DestinationList's inline editing or drag-and-drop has custom focus handling, there could be conflicts.

**Mitigation**: Test the full flow: click Edit on a destination card → modal opens → edit → save → modal closes → focus returns to the card. Radix should handle this gracefully.

### 5. Select inside Dialog

**Risk**: Radix Select renders a portal. Inside a Radix Dialog (also a portal), the Select dropdown needs to appear above the Dialog. z-index stacking may need adjustment.

**Mitigation**: Radix handles portal stacking natively (newer portals stack above older ones). This should work out of the box. Test Select in DestinationModal and transport modals.

---

## Verification Checklist

After completing all steps:

- [ ] DepartureTransportModal: opens, form works, legs management, save, cancel, Escape, overlay click, mobile full-screen
- [ ] ReturnTransportModal: same as above
- [ ] ShareModal: opens, generate link, copy link, pending state blocks dismiss, close button, Escape, overlay click
- [ ] DestinationModal: opens, all 4 collapsible sections work, all fields editable, stopover toggle, validation errors, save with spinner, cancel, Escape (blocked when pending), overlay click (blocked when pending), mobile full-screen with scroll, sticky footer visible
- [ ] Select dropdowns inside all modals work (open, select, close, display value)
- [ ] Focus trap works in all modals (Tab cycles through fields, doesn't escape modal)
- [ ] Focus returns to trigger element after modal closes
- [ ] No double close buttons in DestinationModal
- [ ] Dark mode rendering for all modals
- [ ] Animations: fade-in overlay, scale-in/slide-up content (match current behavior)

---

## Summary

| Modal | Work needed | Structural change? |
|-------|-------------|-------------------|
| DepartureTransportModal | Verify only | No — already uses Dialog |
| ReturnTransportModal | Verify only | No — already uses Dialog |
| ShareModal | Small refactor (~20 lines net reduction) | Yes — replace custom overlay with Dialog wrapper |
| DestinationModal | Medium refactor (~17 lines net reduction) | Yes — replace custom overlay with Dialog wrapper, handle 3-part layout |

Total estimated code reduction: ~37 lines, plus deletion of ~60 lines of duplicated overlay infrastructure (scroll lock, Escape handlers, click-outside logic) that Radix handles natively.
