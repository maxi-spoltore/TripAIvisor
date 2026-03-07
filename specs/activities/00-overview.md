# Activities & Schedule Feature -- Overview

## What this is
A day planner for each destination in a trip. Users can schedule categorized activities (meals, tours, ticketed events, general) per day, with time conflict warnings and quick-add support.

## Phasing

| Phase | Spec | Scope | Depends on |
|-------|------|-------|------------|
| 1 | `01-data-layer.md` | Migration, types, DB queries, server actions | -- |
| 2 | `02-ui-components.md` | Activity modal, card, category picker, day planner | Phase 1 |
| 3 | `03-integration.md` | Wiring into destination-card/list, i18n, share/export | Phase 1 + 2 |

Each phase is independently shippable:
- Phase 1 can be merged without UI (no user-facing change, backend-only).
- Phase 2 can be developed in parallel with Phase 3 once types exist.
- Phase 3 is the final integration that makes the feature visible.

## Key decisions (already made)
- Inline expansion below destination card (not a separate page)
- Sorted activity list with day tabs (not a proportional time grid)
- 4 categories: `meal`, `tour`, `ticketed`, `general`
- Category-specific fields stored in JSONB `details` column
- Time conflict detection is client-side only
- Drag-to-reorder activities is deferred

## Existing patterns to follow
- DB queries: `src/lib/db/queries/accommodations.ts` (CRUD with admin client)
- Server actions: `src/app/actions/destinations.ts` (auth + revalidate pattern)
- Types: `src/types/database.ts` (interfaces + relation types)
- UI modals: `src/components/trips/destination-modal.tsx` (Dialog + form state)
- State management: `src/components/trips/destination-list.tsx` (useReducer)
- i18n: `src/messages/en.json` / `es.json` (namespace-based)
- Migrations: `supabase/migrations/` (sequential naming)
- Export: `src/lib/utils/import-export.ts` (typed export/validate)
- Shared view: `src/components/trips/trip-view-only.tsx`
