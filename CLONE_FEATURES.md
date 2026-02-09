# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] P1 (Selected) - Strengthen “Share pack” flow with permission presets, expiring links, and an exportable bundle manifest (zip-friendly).
- [ ] P1 (Selected) - Add an in-app hotkey/help overlay (coach-readable, `?`) and a 30-second onboarding tour for first-run users.
- [ ] P2 (Selected) - Improve Analyst timeline UX with faster tag entry and filter persistence across sessions.
- [ ] P1 - Add telestration-lite drawing tools (arrows/lines) on evidence clips and include exports in presentation packs.
- [ ] P2 - Add an “Invite staff” modal (email + role preset) and log invitations to the audit stream.
- [ ] P2 - Add a one-click “Export zip bundle” option that packages manifest + report + notes + cover + presentation assets.
- [ ] P3 - Add lightweight performance instrumentation (render timing + localStorage write counts) to catch regressions as the prototype grows.
- [ ] P3 - Add basic accessibility checks for modals (focus management, escape-close, aria labels) and keyboard-only navigation pass.

## Implemented
- [x] 2026-02-09 - Made hash routing access-aware (auto-redirect to first permitted route; hotkeys and topbar respect access). Evidence: `src/ui/web/src/App.tsx`, `src/ui/web/src/hooks/useHotkeys.ts`.
- [x] 2026-02-09 - Deduplicated and recency-ordered saved searches (bump on apply/save; cap list). Evidence: `src/ui/web/src/context/LibraryContext.tsx`, `src/ui/web/src/pages/Library.tsx`, `src/ui/web/src/utils/librarySearches.ts`, `src/ui/web/src/utils/librarySearches.test.ts`, `src/ui/web/src/types.ts`, `src/ui/web/src/utils/guards.ts`.
- [x] 2026-02-09 - Added global ErrorBoundary and a safe “reset local data” recovery path. Evidence: `src/ui/web/src/components/ErrorBoundary.tsx`, `src/ui/web/src/utils/storage.ts`, `src/ui/web/src/App.tsx`.
- [x] 2026-02-09 - Added `PROJECT_MEMORY.md` and `INCIDENTS.md` and linked them from `README.md`. Evidence: `PROJECT_MEMORY.md`, `INCIDENTS.md`, `README.md`.
- [x] 2026-02-09 - Added `npm run verify` and updated CI/docs to use it for command parity. Evidence: `package.json`, `.github/workflows/ci.yml`, `docs/VERIFICATION.md`.
- [x] 2026-02-09 - Hygiene: added and ran a stricter unused-code check (`npm run typecheck:strict`). Evidence: `package.json`, `docs/VERIFICATION.md`.
- [x] 2026-02-08 - Hardened persisted-state hydration with runtime guards and safe defaults across contexts. Evidence: `src/ui/web/src/utils/guards.ts`, `src/ui/web/src/utils/storage.ts`, `src/ui/web/src/context/*.tsx`.
- [x] 2026-02-08 - Added ingest validation for segment windows and manual offsets with inline errors. Evidence: `src/ui/web/src/pages/Ingest.tsx`, `src/ui/web/src/styles.css`.
- [x] 2026-02-08 - Fixed async reliability issues (functional audit/log state writes, upload timer cleanup, stale segment ref). Evidence: `src/ui/web/src/context/AuditContext.tsx`, `src/ui/web/src/context/LabelsContext.tsx`, `src/ui/web/src/context/AnnotationsContext.tsx`, `src/ui/web/src/pages/Ingest.tsx`.
- [x] 2026-02-08 - Added automated test stack with Vitest plus regression coverage. Evidence: `package.json`, `vitest.config.ts`, `src/ui/web/src/utils/*.test.ts`.
- [x] 2026-02-08 - Added reusable segment report utility and test coverage. Evidence: `src/ui/web/src/utils/reports.ts`, `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/reports.test.ts`.
- [x] 2026-02-08 - Added CI workflow and verification playbook for consistent local/CI quality gates. Evidence: `.github/workflows/ci.yml`, `docs/VERIFICATION.md`, `README.md`.

## Insights
- Corrupted localStorage is a high-likelihood failure mode in long-running prototypes; runtime guards prevented unsafe hydration across every persisted context.
- Segment report generation was difficult to validate while embedded in React state handlers; extracting to `utils/reports.ts` made deterministic unit tests straightforward.
- Enforcing typecheck + tests in CI surfaced latent type mismatches that Vite build alone would not catch.
- Market baseline for matchday tools clusters around rapid clipping/tagging, role-based access, and shareable packs; the prototype’s fastest wins are reliability and workflow polish (access-aware routing, bounded saved searches, crash recovery).

## Notes
- This file is maintained by the autonomous clone loop.
