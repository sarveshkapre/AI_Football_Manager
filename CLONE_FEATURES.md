# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] P3 - Investigate and mitigate `npm audit` moderate vulnerabilities without breaking Vite/React tooling.
- [ ] P3 - Add bulk tag/label actions in Analyst timeline (multi-select + apply/remove) to speed up matchday review.
- [ ] P3 - Add “imported pack banner” state (show pack title/owner/match + clear-import) to reduce confusion after importing.
- [ ] P4 - Add report-queue presets (coach bench vs analyst room) for faster “build a pack” workflows.
- [ ] P4 - Add minimal E2E smoke test (app boots + navigate routes + open clip modal) to reduce UI regressions not covered by unit tests.

## Implemented
- [x] 2026-02-09 - Added Reports pack import flow for `afm-bundle.zip` / `afm-report.json` that hydrates the report queue + notes (labels/annotations/telestration), with validation and unit tests. Evidence: `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/import.ts`, `src/ui/web/src/utils/import.test.ts`, `src/ui/web/src/context/LabelsContext.tsx`, `src/ui/web/src/context/AnnotationsContext.tsx`, `src/ui/web/src/context/TelestrationContext.tsx`.
- [x] 2026-02-09 - Keyboard accessibility pass: added skip-to-content link and `aria-current` for active navigation items. Evidence: `src/ui/web/src/App.tsx`, `src/ui/web/src/styles.css`.
- [x] 2026-02-09 - Added lightweight persistence performance counters (localStorage writes/removes/bytes + top keys) surfaced in Settings. Evidence: `src/ui/web/src/utils/perf.ts`, `src/ui/web/src/utils/storage.ts`, `src/ui/web/src/pages/Settings.tsx`.
- [x] 2026-02-09 - Added one-click Draft Report zip bundle export (manifest + report + notes + cover + HTML packs + evidence package) for offline share handoff. Evidence: `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/utils/export.ts`, `package.json`, `src/ui/web/src/utils/export.test.ts`.
- [x] 2026-02-09 - Added telestration-lite drawing (freehand + arrow) on evidence clips, persisted per clip, and exported in presentation packs + evidence packages. Evidence: `src/ui/web/src/components/Modal/ClipModal.tsx`, `src/ui/web/src/context/TelestrationContext.tsx`, `src/ui/web/src/utils/export.ts`, `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/guards.ts`.
- [x] 2026-02-09 - Improved modal accessibility (focus trap, Esc-close, return focus, click-outside close, `aria-labelledby`). Evidence: `src/ui/web/src/components/Modal/Modal.tsx`, `src/ui/web/src/components/HotkeyHelpModal.tsx`, `src/ui/web/src/components/OnboardingTourModal.tsx`, `src/ui/web/src/components/Modal/ClipModal.tsx`, `src/ui/web/src/styles.css`.
- [x] 2026-02-09 - Added “Invite staff” modal (email + role preset), persisted locally, with audit logging. Evidence: `src/ui/web/src/components/InviteStaffModal.tsx`, `src/ui/web/src/context/InvitesContext.tsx`, `src/ui/web/src/pages/Settings.tsx`, `src/ui/web/src/App.tsx`, `src/ui/web/src/utils/guards.ts`.
- [x] 2026-02-09 - Made ClipModal overlay toggles affect queued clips and exports (no stale overlay state). Evidence: `src/ui/web/src/components/Modal/ClipModal.tsx`.
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
- Bounded scan indicates telestration/drawing is explicit table-stakes (arrows/freehand/lines) with “presentational mode” variants (drawings shown only during presentation). Sources (external, untrusted): https://www.hudl.com/products/sportscode/tiers, https://www.hudl.com/products/studio, https://provideo.catapultsports.com/hc/en-us/articles/7333038946959-Freeze-Frame-Telestrations.
- Offline sharing commonly includes packaged artifacts (video + graphics + notes) rather than single JSON exports; bundling assets into a zip reduces friction for “send to staff” workflows even in a prototype context.
- Market scan (bounded) suggests parity expectations around live collaboration and “shared timelines” for matchday workflows, plus shareable presentations/packs with permissions. Sources (external, untrusted): https://www.hudl.com/releases/sportscode, https://provideo.catapultsports.com/hc/en-us/articles/7333070047887-Sharing-a-Presentation-Feature-in-Focus-Client, https://provideo.catapultsports.com/hc/en-us/articles/7333023161871-Live-Capture-Using-Multiple-Devices.
- Market scan (bounded) reinforces that “presentation tooling” is positioned as a first-class workflow (not an export afterthought), including multi-angle/auto-annotations and cloud sharing. Sources (external, untrusted): https://www.catapult.com/solutions/pro-video, https://www.hudl.com/products/studio, https://www.hudl.com/blog/hudl-studio-telestration-sportscode.

## Notes
- This file is maintained by the autonomous clone loop.
