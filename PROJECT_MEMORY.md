# Project Memory

This file is the evolving memory of the repository: decisions, why they were made, evidence, and follow-ups.

## Trust Labels
- **Trusted**: grounded in repo evidence (code/tests/docs) or direct measurement in this repo.
- **Untrusted**: hypothesis or market signal without local validation.

## Decision Log

### 2026-02-09 (Cycle 2) - Make UI Routing and Library State More Resilient
- **Decision**: Make hash navigation access-aware (auto-redirect when a view is disabled), dedupe and recency-order saved searches, and add a global ErrorBoundary with recovery actions.
- **Why**: Role presets can disable views; landing on a disabled route should not strand users. Saved searches should not grow without bounds. Runtime crashes should recover gracefully.
- **Evidence**:
  - Access control is persisted in `afm.access` and can disable routes (`src/ui/web/src/context/AccessContext.tsx`).
  - Saved searches were append-only and unbounded (`src/ui/web/src/context/LibraryContext.tsx`).
  - Prototype relies on localStorage and async UI flows where unexpected runtime errors can surface.
- **Impact**: Fewer “stuck” states, reduced saved-search bloat, and a non-blank failure mode.
- **Follow-ups**:
  - Add unit tests for saved-search upsert/touch behavior if we keep expanding Library features.
  - Consider a lightweight, generic toast/notification context for non-live events (optional).
- **Trust label**: Trusted
- **Confidence**: High

