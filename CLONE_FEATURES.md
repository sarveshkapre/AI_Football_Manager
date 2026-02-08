# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] P2 - Improve route/access resilience by auto-redirecting to first permitted view when hash route is not allowed.
- [ ] P2 - Add deduplication and recency ordering for saved library searches to prevent list bloat.
- [ ] P3 - Prune dead prototype artifacts (unused exports/files) discovered during code sweep.

## Implemented
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

## Notes
- This file is maintained by the autonomous clone loop.
