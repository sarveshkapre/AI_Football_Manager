# Project Memory

This file is the evolving memory of the repository: decisions, why they were made, evidence, and follow-ups.

## Trust Labels
- **Trusted**: grounded in repo evidence (code/tests/docs) or direct measurement in this repo.
- **Untrusted**: hypothesis or market signal without local validation.

## Decision Log

### 2026-02-09 (Cycle 2) - Make UI Routing and Library State More Resilient
- **Decision**: Make hash navigation access-aware (auto-redirect when a view is disabled), dedupe and recency-order saved searches, add a global ErrorBoundary with recovery actions, and introduce a single-command verification path (`npm run verify`, plus a stricter unused-code check).
- **Why**: Role presets can disable views; landing on a disabled route should not strand users. Saved searches should not grow without bounds. Runtime crashes should recover gracefully.
- **Evidence**:
  - Access control is persisted in `afm.access` and can disable routes (`src/ui/web/src/context/AccessContext.tsx`).
  - Saved searches were append-only and unbounded (`src/ui/web/src/context/LibraryContext.tsx`).
  - Prototype relies on localStorage and async UI flows where unexpected runtime errors can surface.
  - Local/CI verification is standardized via `npm run verify` and `.github/workflows/ci.yml` (`package.json`, `docs/VERIFICATION.md`).
- **Impact**: Fewer “stuck” states, reduced saved-search bloat, and a non-blank failure mode.
- **Follow-ups**:
  - Add unit tests for saved-search upsert/touch behavior if we keep expanding Library features.
  - Consider a lightweight, generic toast/notification context for non-live events (optional).
- **Trust label**: Trusted
- **Confidence**: High

## Recent Decisions (Structured)
- 2026-02-09 | Add in-app hotkey help (`?`) + first-run onboarding tour | Improve first-run comprehension and reduce bench friction; keep the “coach-readable in 5 seconds” bar | Evidence: `src/ui/web/src/components/HotkeyHelpModal.tsx`, `src/ui/web/src/components/OnboardingTourModal.tsx`, `src/ui/web/src/App.tsx`, `src/ui/web/src/hooks/useHotkeys.ts`, `src/ui/web/src/styles.css`; `npm run verify` (pass) | Commit: `fb50412` | Confidence: High | Trust: Trusted
- 2026-02-09 | Strengthen Draft report Share pack with permission presets + expiring links + bundle manifest export | Match table-stakes share workflows (permissioning, expiry, offline handoff) while staying prototype-safe | Evidence: `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/utils/share.ts`, `src/ui/web/src/utils/share.test.ts`, `src/ui/web/src/styles.css`; `npm test` (pass) | Commit: `c76663e` | Confidence: High | Trust: Trusted
- 2026-02-09 | Persist Analyst timeline filters + speed up manual tagging (Enter-to-add) | Analysts repeatedly filter by tag/confidence; persistence removes rework and Enter-to-add reduces friction during live review | Evidence: `src/ui/web/src/pages/Analyst.tsx`, `src/ui/web/src/utils/guards.ts`, `src/ui/web/src/utils/guards.test.ts`, `src/ui/web/src/types.ts` | Commit: `aea3334` | Confidence: High | Trust: Trusted
- 2026-02-09 | Bounded market scan: baseline expectations for matchday video workflows | Used to guide parity UX (tagging hotkeys, clip packs, permissioned sharing) without copying proprietary assets/code | Evidence: external sources: https://www.hudl.com/products/sportscode, https://www.catapult.com/solutions/pro-video, https://wyscout.com/, https://www.nacsport.com/, https://longomatch.com/, https://metrica-sports.com/ | Commit: n/a | Confidence: Medium | Trust: Untrusted

## Mistakes And Fixes
- None recorded for this cycle.

## Verification Evidence
- `npm test` (pass)
- `npm run typecheck` (pass)
- `npm run verify` (pass)
- `npm run build` (pass)
- `npm run dev -- --host 127.0.0.1 --port 4173` (pass: server started)
- `curl -I http://127.0.0.1:4173/` (pass: `HTTP/1.1 200 OK`)
