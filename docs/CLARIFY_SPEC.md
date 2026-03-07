# UX Copy Improvements — Specification

## Overview

The app has generally decent copy, but several areas suffer from vague error messages, technical jargon exposed to users, inconsistent phrasing, and hardcoded strings bypassing the i18n system. This spec organizes all proposed changes into implementation phases.

---

## Phase 1: Extract Hardcoded Strings to i18n

**Priority:** High — These bypass the translation system entirely, breaking the ES locale.

### Problem
Several components use `locale === 'es'` ternaries instead of `useTranslations()`. This is fragile and won't scale to additional locales.

### Files to modify
- `src/components/trips/destination-list.tsx`
- `src/components/trips/import-trip-button.tsx`
- `src/components/trips/share-modal.tsx`
- `src/components/trips/destination-modal.tsx`
- `src/messages/en.json`
- `src/messages/es.json`

### Changes

#### 1a. Add `errors` namespace to translation files

Add the following keys to `en.json` and `es.json`:

**`en.json`** — new `errors` namespace:
```json
"errors": {
  "reorderDestinations": "Something went wrong while reordering. Your changes were reverted.",
  "addDestination": "Could not add the destination. Please try again.",
  "deleteDestination": "Could not delete the destination. It has been restored.",
  "importTrip": "Could not import this trip. The file may be corrupted or incompatible.",
  "invalidFileFormat": "This file doesn't look like a valid trip export. Try a different file.",
  "invalidJson": "This file couldn't be read. Make sure it's a .json file exported from TripAIvisor.",
  "generateShareLink": "Could not generate the link. Please try again.",
  "copyLink": "Could not copy to clipboard. Try selecting and copying the link manually.",
  "cityRequired": "Enter a city name to add a destination."
}
```

**`es.json`** — new `errors` namespace:
```json
"errors": {
  "reorderDestinations": "Hubo un error al reordenar. Se revirtieron los cambios.",
  "addDestination": "No se pudo agregar el destino. Intenta de nuevo.",
  "deleteDestination": "No se pudo eliminar el destino. Fue restaurado.",
  "importTrip": "No se pudo importar el viaje. El archivo puede estar dañado o ser incompatible.",
  "invalidFileFormat": "Este archivo no parece una exportación de viaje válida. Prueba con otro archivo.",
  "invalidJson": "No se pudo leer el archivo. Asegurate de que sea un .json exportado desde TripAIvisor.",
  "generateShareLink": "No se pudo generar el enlace. Intenta de nuevo.",
  "copyLink": "No se pudo copiar. Intenta seleccionar y copiar el enlace manualmente.",
  "cityRequired": "Ingresa el nombre de una ciudad para agregar un destino."
}
```

#### 1b. Add missing common/share keys

| String | Key | EN | ES |
|--------|-----|----|----|
| `"Generating..."` | `share.generating` | `"Generating..."` | `"Generando..."` |
| `"Close"` | `common.close` | `"Close"` | `"Cerrar"` |

#### 1c. Replace inline ternaries in components

In each component, replace patterns like:
```tsx
locale === 'es' ? "No se pudo..." : "Could not..."
```
With:
```tsx
const tErrors = useTranslations('errors');
// ...
tErrors('reorderDestinations')
```

### Guidance
- Start by adding all new keys to both `en.json` and `es.json`
- Then update components one at a time, replacing each ternary with the corresponding `useTranslations` call
- Run `npm run build` after each component to catch issues early
- Search for remaining `locale === 'es'` ternaries to ensure none were missed

---

## Phase 2: Improve Error Messages

**Priority:** High — Users currently get vague errors with no recovery guidance.

### Problem
Error messages say what went wrong but not what users can do about it.

### Changes (already included in Phase 1 translation keys)

The new error messages from Phase 1 already incorporate these improvements:

| Current (vague) | Proposed (actionable) |
|------------------|-----------------------|
| `"Could not reorder destinations."` | `"Something went wrong while reordering. Your changes were reverted."` |
| `"Could not add destination."` | `"Could not add the destination. Please try again."` |
| `"Could not delete destination."` | `"Could not delete the destination. It has been restored."` |
| `"Could not import the trip."` | `"Could not import this trip. The file may be corrupted or incompatible."` |
| `"Invalid file format."` | `"This file doesn't look like a valid trip export. Try a different file."` |
| `"The file is not valid JSON."` | `"This file couldn't be read. Make sure it's a .json file exported from TripAIvisor."` |
| `"Could not generate the share link."` | `"Could not generate the link. Please try again."` |
| `"Could not copy the link."` | `"Could not copy to clipboard. Try selecting and copying the link manually."` |
| `"City is required."` | `"Enter a city name to add a destination."` |

### Guidance
- If Phase 1 is done, these messages are already in place via the translation keys
- If implementing independently, update the inline strings directly in the components

---

## Phase 3: Remove Technical Jargon

**Priority:** Medium — Confusing labels but not blocking functionality.

### Problem
Terms like "JSON", "leg", and "revert to single transport" leak implementation details to users.

### Files to modify
- `src/messages/en.json`
- `src/messages/es.json`

### Changes

| Key | Current | Proposed (EN) | Proposed (ES) |
|-----|---------|---------------|---------------|
| `trips.import` | `"Import JSON"` | `"Import trip"` | `"Importar viaje"` |
| `trips.export` | `"Export JSON"` | `"Export trip"` | `"Exportar viaje"` |
| `transport.leaveTime` | `"Leave accommodation time"` | `"Time to leave accommodation"` | `"Hora de salida del alojamiento"` |
| `transport.addLeg` | `"Add leg"` | `"Add connection"` | `"Agregar conexión"` |
| `transport.removeLeg` | `"Remove leg"` | `"Remove connection"` | `"Quitar conexión"` |
| `transport.revertToSingle` | `"Revert to single transport"` | `"Remove all connections"` | `"Quitar todas las conexiones"` |
| `transport.legN` | `"Leg {n}"` | `"Segment {n}"` | `"Tramo {n}"` |

### Guidance
- These are simple find-and-replace changes in the translation JSON files
- No component code changes needed — the keys remain the same, only values change
- Verify the transport section UI after changes to ensure labels fit within their containers

---

## Phase 4: Clarify Descriptions & Validation

**Priority:** Low — Polish pass for remaining unclear copy.

### 4a. Share Modal Description

**Files:** `src/messages/en.json`, `src/messages/es.json`

| Current | Proposed (EN) | Proposed (ES) |
|---------|---------------|---------------|
| `"View only"` | `"Anyone with the link can view this trip"` | `"Cualquier persona con el enlace puede ver este viaje"` |

### 4b. Friendlier Validation Messages

**File:** `src/components/trips/destination-modal.tsx`

| Current | Proposed (EN) |
|---------|---------------|
| `"City name is required."` | `"Enter a city name."` |
| `"Duration must be at least 1 day (0 for stopover)."` | `"Duration must be at least 1 day. Use 0 for stopovers."` |
| `"Budget must be a valid number."` | `"Enter a valid number for the budget."` |

### 4c. Vague Confirmation Dialog

**Key:** `common.confirmDelete` in `en.json:9` / `es.json:9`

Current value: `"Are you sure you want to delete?"`

**Action:** Check if this key is used anywhere. The destination-specific confirmation (`confirmDeleteDestination`) already provides context. If `common.confirmDelete` is unused, leave it. If used, replace with context-specific text.

### Guidance
- These are small, independent changes that can be done in any order
- For validation messages, add them to translation files if extracted in Phase 1, or update inline if not
- Test by triggering each validation path (empty city, 0 duration, non-numeric budget)

---

## Verification Checklist

After all phases:

1. `npm run build` passes with no errors
2. Manual check in EN locale:
   - Trigger all error states (empty city, bad import file, failed share link)
   - Check share modal description text
   - Verify transport section labels ("Add connection", "Segment 1", etc.)
   - Check import/export button labels
3. Manual check in ES locale:
   - Same flows as EN, verifying Spanish translations
4. Run `grep -r "locale === 'es'" src/` — should return no results (all ternaries replaced)

---

## Implementation Summary (Completed)

### Scope update applied
- Expanded beyond the original 4 Phase 1 files to remove hardcoded locale-branch copy across the trip experience, per follow-up instruction.
- Replaced all `locale === 'es'` translation branches in `src` with i18n-backed keys and `useTranslations`/`getTranslations`.

### Phase 1 delivered (hardcoded strings extracted to i18n)
- Added a new `errors` namespace in both `src/messages/en.json` and `src/messages/es.json`.
- Added required keys from spec:
  - `share.generating`
  - `common.close`
- Migrated targeted components to translation keys:
  - `src/components/trips/destination-list.tsx`
  - `src/components/trips/import-trip-button.tsx`
  - `src/components/trips/share-modal.tsx`
  - `src/components/trips/destination-modal.tsx`
- Also migrated additional components with hardcoded copy:
  - `src/app/[locale]/trips/page.tsx`
  - `src/components/trips/trip-header.tsx`
  - `src/components/trips/trip-view-only.tsx`
  - `src/components/trips/destination-card.tsx`
  - `src/components/trips/departure-card.tsx`
  - `src/components/trips/return-card.tsx`
  - `src/components/trips/departure-transport-modal.tsx`
  - `src/components/trips/return-transport-modal.tsx`

### Phase 2 delivered (error messages improved)
- Implemented actionable error messages through `errors.*` keys, including:
  - destination reorder/add/delete/save failures
  - import format/JSON/import failures
  - share link generation/copy failures
  - departure/return transport save failures
  - validation errors (city, duration, budget)

### Phase 3 delivered (technical jargon reduced)
- Updated translation values per spec:
  - `trips.import`: `"Import trip"` / `"Importar viaje"`
  - `trips.export`: `"Export trip"` / `"Exportar viaje"`
  - `transport.leaveTime`: `"Time to leave accommodation"` / `"Hora de salida del alojamiento"`
  - `transport.addLeg`: `"Add connection"` / `"Agregar conexión"`
  - `transport.removeLeg`: `"Remove connection"` / `"Quitar conexión"`
  - `transport.revertToSingle`: `"Remove all connections"` / `"Quitar todas las conexiones"`
  - `transport.legN`: `"Segment {n}"` / `"Tramo {n}"`

### Phase 4 delivered (clarity and validation polish)
- Updated share modal description:
  - `share.viewOnly`: `"Anyone with the link can view this trip"` / `"Cualquier persona con el enlace puede ver este viaje"`
- Validation copy updated via translation keys:
  - `"Enter a city name."`
  - `"Duration must be at least 1 day. Use 0 for stopovers."`
  - `"Enter a valid number for the budget."`
- `common.confirmDelete` was in use (trip delete dialog), so it was made context-specific:
  - EN: `"Are you sure you want to delete this trip?"`
  - ES: `"¿Estás seguro de que deseas eliminar este viaje?"`

### Additional translation coverage added
- Added several reusable UI keys to support hardcoded-copy removal (`common.actions`, `common.showDetails`, `common.hideDetails`, `common.expand`, `common.collapse`, `common.noDateSet`, `common.saving`, etc.).
- Added supporting domain keys for transport/accommodation/destinations/share text used by cards, modals, and read-only views.

### Code-level adjustments made while implementing
- Removed now-unused `locale` props from:
  - `DestinationModal`
  - `DepartureTransportModal`
  - `ReturnTransportModal`
- Updated their call sites accordingly in:
  - `destination-list.tsx`
  - `departure-card.tsx`
  - `return-card.tsx`

### Validation results
- `npm run build`: **passed** (Next.js build + lint + type checks).
- `rg -n "locale === 'es'" src`: **no matches**.
- No compile/type errors remain from this scope.
