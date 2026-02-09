# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] P1 - Add one-click “Export zip bundle” in Draft Report (manifest + report JSON/CSV + notes + cover text/image + presentation HTML) for offline share handoff.
- [ ] P1 - Add telestration-lite drawing tools (freehand + arrow) on evidence clips, persist per-clip, and include exports in presentation packs + evidence packages.
- [ ] P2 - Fix modal accessibility basics: focus trap, Esc-close, return focus on close, and `aria-labelledby` wiring (Clip / Hotkeys / Tour).
- [ ] P2 - Add an “Invite staff” modal (email + role preset) in Settings, persist invites locally, and log invitations to the audit stream.
- [ ] P2 - Make ClipModal overlay toggles affect queued clip + clip exports (don’t export stale overlay state).
- [ ] P3 - Add lightweight performance instrumentation (render timing + localStorage write counts) to catch regressions as the prototype grows.
- [ ] P3 - Add keyboard-only navigation pass for the main views (tab order, visible focus states, skip-to-content).
- [ ] P3 - Add unit tests for new export helpers (zip builder, telestration serialization guards) to keep prototype exports deterministic.
- [ ] P4 - Add bulk tag/label actions in Analyst timeline (multi-select + apply/remove) to speed up matchday review.
- [ ] P4 - Add minimal “pack import” flow in Reports (load a saved bundle manifest JSON and hydrate the queue) for round-trip validation.

## Implemented
- [x] 2026-02-09 - Strengthened Draft report Share pack with permission presets, expiring links, and a downloadable bundle manifest. Evidence: `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/utils/share.ts`, `src/ui/web/src/utils/share.test.ts`, `src/ui/web/src/styles.css`.
- [x] 2026-02-09 - Added an in-app hotkey/help overlay (coach-readable, `?`) and a skippable first-run onboarding tour. Evidence: `src/ui/web/src/components/HotkeyHelpModal.tsx`, `src/ui/web/src/components/OnboardingTourModal.tsx`, `src/ui/web/src/App.tsx`, `src/ui/web/src/hooks/useHotkeys.ts`, `src/ui/web/src/styles.css`.
- [x] 2026-02-09 - Persisted Analyst timeline filters across sessions and added Enter-to-add tagging. Evidence: `src/ui/web/src/pages/Analyst.tsx`, `src/ui/web/src/utils/guards.ts`, `src/ui/web/src/utils/guards.test.ts`, `src/ui/web/src/types.ts`.
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
- Market scan (bounded) suggests table-stakes: live tagging/hotkeys, rapid clip assembly, and shareable/permissioned packs with expiry. Sources (external, untrusted): https://www.hudl.com/products/sportscode, https://www.catapult.com/solutions/pro-video, https://wyscout.com/, https://www.nacsport.com/, https://longomatch.com/, https://metrica-sports.com/.

## Notes
- This file is maintained by the autonomous clone loop.
