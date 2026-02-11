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

### 2026-02-09 (Cycle 4) - Ship Workflow Polish + Add UI Smoke Coverage
- **Decision**: Prioritize matchday workflow speed and reliability: bulk timeline selection/tag actions in Analyst, a persistent import-context banner in Reports, and a UI smoke test that exercises boot/navigation/clip modal. Clear `npm audit` without forcing a Vite major upgrade by overriding `esbuild`.
- **Why**: Analysts need bulk actions to reduce repetitive tagging; imported packs need persistent context to avoid “what state am I in?” confusion; and the ClipModal is a core flow worth protecting with an integration smoke test. The `esbuild` advisory was blocking hygiene and could be mitigated safely via overrides.
- **Evidence**:
  - Bulk timeline multi-select and tag add/remove lives in `src/ui/web/src/pages/Analyst.tsx` with styling in `src/ui/web/src/styles.css`.
  - Reports import banner state is persisted and guarded via `src/ui/web/src/pages/Reports.tsx` and `src/ui/web/src/utils/guards.ts`.
  - UI smoke test added at `src/ui/web/src/App.smoke.test.tsx` and wired via `vitest.config.ts`.
  - ClipModal hook-order crash fixed in `src/ui/web/src/components/Modal/ClipModal.tsx`.
  - `npm audit --audit-level=moderate` now reports 0 vulnerabilities after `esbuild` override (`package.json`, `package-lock.json`).
- **Impact**: Faster tagging during review, clearer post-import state, and reduced risk of regressions in a high-frequency UI path.
- **Follow-ups**:
  - Consider a true browser E2E pass (Playwright) once CI/runtime budgets are clear.
  - Evaluate whether happy-dom warnings in CI should be eliminated (switch to jsdom or configure environment options).
    Done 2026-02-10: force an in-memory `localStorage` in the UI smoke and make storage helpers prefer `window.localStorage` to avoid Node WebStorage warnings.
- **Trust label**: Trusted
- **Confidence**: High

## Recent Decisions (Structured)
- 2026-02-11 | Add clip-title previews to Reports import review modal + deterministic preview utility tests | Import decisions were still counts-only; operators needed concrete examples of what changes before applying replace/append in high-pressure workflows | Evidence: `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/packDiff.ts`, `src/ui/web/src/utils/packDiff.test.ts`, `src/ui/web/src/styles.css`, `README.md`; `npm run verify` (pass) | Commit: `bdef607` | Confidence: High | Trust: Trusted
- 2026-02-11 | Bounded market refresh for matchday video tools | Revalidate parity expectations before choosing Cycle 1 work; import safety/review clarity remains a stable table-stakes pattern | Evidence: https://support.catapultsports.com/hc/en-us/articles/14951371895183, https://support.catapultsports.com/hc/en-us/articles/360002587274-Importing-a-database-into-Focus, https://www.hudl.com/releases/sportscode, https://longomatch.com/switching-to-the-new-database-format-in-longomatch-pro-1-3-0 | Commit: n/a | Confidence: Medium | Trust: Untrusted
- 2026-02-09 | Add in-app hotkey help (`?`) + first-run onboarding tour | Improve first-run comprehension and reduce bench friction; keep the “coach-readable in 5 seconds” bar | Evidence: `src/ui/web/src/components/HotkeyHelpModal.tsx`, `src/ui/web/src/components/OnboardingTourModal.tsx`, `src/ui/web/src/App.tsx`, `src/ui/web/src/hooks/useHotkeys.ts`, `src/ui/web/src/styles.css`; `npm run verify` (pass) | Commit: `fb50412` | Confidence: High | Trust: Trusted
- 2026-02-09 | Strengthen Draft report Share pack with permission presets + expiring links + bundle manifest export | Match table-stakes share workflows (permissioning, expiry, offline handoff) while staying prototype-safe | Evidence: `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/utils/share.ts`, `src/ui/web/src/utils/share.test.ts`, `src/ui/web/src/styles.css`; `npm test` (pass) | Commit: `c76663e` | Confidence: High | Trust: Trusted
- 2026-02-09 | Persist Analyst timeline filters + speed up manual tagging (Enter-to-add) | Analysts repeatedly filter by tag/confidence; persistence removes rework and Enter-to-add reduces friction during live review | Evidence: `src/ui/web/src/pages/Analyst.tsx`, `src/ui/web/src/utils/guards.ts`, `src/ui/web/src/utils/guards.test.ts`, `src/ui/web/src/types.ts` | Commit: `aea3334` | Confidence: High | Trust: Trusted
- 2026-02-09 | Bounded market scan: baseline expectations for matchday video workflows | Used to guide parity UX (tagging hotkeys, clip packs, permissioned sharing) without copying proprietary assets/code | Evidence: external sources: https://www.hudl.com/products/sportscode, https://www.catapult.com/solutions/pro-video, https://wyscout.com/, https://www.nacsport.com/, https://longomatch.com/, https://metrica-sports.com/ | Commit: n/a | Confidence: Medium | Trust: Untrusted
- 2026-02-09 | Add accessible modal shell (focus trap + Esc/backdrop close + focus restore) | Modals are frequent in matchday workflows; keyboard safety is table-stakes and prevents “stuck” UI states | Evidence: `src/ui/web/src/components/Modal/Modal.tsx`, updated modal consumers; `npm test` (pass); `npm run typecheck` (pass) | Commit: `8022e29` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add Invite staff flow (local stub) with audit logging | Collaboration entrypoints reduce friction to share packs; persisted invites + audit trail keeps behavior inspectable in a prototype | Evidence: `src/ui/web/src/components/InviteStaffModal.tsx`, `src/ui/web/src/context/InvitesContext.tsx`, `src/ui/web/src/pages/Settings.tsx`, `src/ui/web/src/App.tsx`; `npm test` (pass) | Commit: `3ba4356` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add telestration-lite drawing (freehand + arrow) and export it in packs | Drawing tools are table-stakes for analyst presentations; persisting normalized strokes enables consistent export/preview without video rendering dependencies | Evidence: `src/ui/web/src/components/Modal/ClipModal.tsx`, `src/ui/web/src/context/TelestrationContext.tsx`, `src/ui/web/src/utils/export.ts`, `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/pages/Reports.tsx`; tests added for guards/export | Commit: `1ff2caf` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add Draft Report zip bundle export for offline share handoff | Staff workflows often require shipping a single artifact (manifest + packs + notes + cover); zip bundling reduces friction while keeping exports deterministic | Evidence: `src/ui/web/src/pages/DraftReport.tsx`, `src/ui/web/src/utils/export.ts`, `src/ui/web/src/utils/export.test.ts`, dependency `jszip`; `npm test` (pass) | Commit: `ff3b2f5` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add Reports pack import (zip/report JSON) with validated hydration of queue + notes | Enables round-trip validation of export bundles and reduces friction when staff sends packs back/forth; hydration is constrained to imported clip IDs to avoid wiping unrelated local state | Evidence: `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/import.ts`, `src/ui/web/src/utils/import.test.ts`, `src/ui/web/src/context/LabelsContext.tsx`, `src/ui/web/src/context/AnnotationsContext.tsx`, `src/ui/web/src/context/TelestrationContext.tsx`; `npm run verify` (pass) | Commit: `fe7ab29` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add skip-to-content link + `aria-current` for active navigation | Improves keyboard accessibility and reduces “tab fatigue” in matchday workflows | Evidence: `src/ui/web/src/App.tsx`, `src/ui/web/src/styles.css`; `npm run verify` (pass) | Commit: `fe7ab29` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add lightweight localStorage persistence counters in Settings | Provides quick visibility into persistence churn (writes/removes/bytes) to catch regressions as prototype grows | Evidence: `src/ui/web/src/utils/perf.ts`, `src/ui/web/src/utils/storage.ts`, `src/ui/web/src/pages/Settings.tsx`; `npm run verify` (pass) | Commit: `83f6402` | Confidence: Medium | Trust: Trusted
- 2026-02-09 | Add Analyst bulk multi-select tagging + Reports import banner | Reduce matchday friction (bulk tagging, post-import clarity) while staying prototype-safe | Evidence: `src/ui/web/src/pages/Analyst.tsx`, `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/styles.css`, `src/ui/web/src/utils/guards.ts`; `npm run verify` (pass) | Commit: `4b68231` | Confidence: High | Trust: Trusted
- 2026-02-09 | Clear `npm audit` by overriding `esbuild` | Address dev-server advisory without forcing a Vite major upgrade; keep CI green | Evidence: `package.json`, `package-lock.json`; `npm audit --audit-level=moderate` (pass) | Commit: `820db3e` | Confidence: High | Trust: Trusted
- 2026-02-09 | Add UI smoke test and fix ClipModal hook ordering | Prevent regressions and eliminate a hook-order crash in a core “open clip” workflow | Evidence: `src/ui/web/src/App.smoke.test.tsx`, `vitest.config.ts`, `src/ui/web/src/components/Modal/ClipModal.tsx`; `npm run verify` (pass) | Commit: `b1ce305`, `4d5faeb` | Confidence: High | Trust: Trusted
- 2026-02-10 | Add pack import review with strategy + diff + conflict handling | Prevent accidental queue replacement and make pack merge semantics explicit (replace vs append; overlap policies) while keeping local-only prototype safety | Evidence: `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/packDiff.ts`, `src/ui/web/src/styles.css`, `src/ui/web/src/utils/packDiff.test.ts`; `npm run verify` (pass) | Commit: `8b74500` | Confidence: High | Trust: Trusted
- 2026-02-10 | Add Draft Report presets + bench cut | Reduce time-to-pack for matchday by providing role-aligned defaults and a one-click short-pack trim | Evidence: `src/ui/web/src/pages/DraftReport.tsx`; `npm run verify` (pass) | Commit: `8b74500` | Confidence: High | Trust: Trusted
- 2026-02-10 | Add recent-tag palette + Alt+1..9 hotkeys in Analyst | Reduce mouse travel during manual/live tagging, preserve recency in local persistence, and keep bulk selection flows fast | Evidence: `src/ui/web/src/pages/Analyst.tsx`, `src/ui/web/src/utils/recentTags.ts`, `src/ui/web/src/styles.css`, `src/ui/web/src/utils/recentTags.test.ts`; `npm run verify` (pass) | Commit: `8b74500` | Confidence: High | Trust: Trusted
- 2026-02-10 | Eliminate Node WebStorage `localStorage` warnings in UI smoke | Keep verification output clean and make storage utilities robust in non-browser runtimes by using `window.localStorage` when available and stubbing deterministic in-memory storage for the happy-dom integration smoke | Evidence: `src/ui/web/src/App.smoke.test.tsx`, `src/ui/web/src/utils/storage.ts`, `src/ui/web/src/utils/storage.test.ts`; `npm run verify` (pass) | Commit: `d5dbb34` | Confidence: High | Trust: Trusted
- 2026-02-10 | Reports import undo safety | Reduce operator risk after applying an imported pack by providing a one-step “Undo import” that restores the previous queue + notes snapshot; warn before overwriting if the queue changed since import | Evidence: `src/ui/web/src/pages/Reports.tsx`, `src/ui/web/src/utils/guards.ts`, `src/ui/web/src/utils/guards.test.ts`, `src/ui/web/src/styles.css`; `npm run verify` (pass); `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` + `curl -I http://127.0.0.1:4173/ | head` (pass: `HTTP/1.1 200 OK`) | Commit: `422d046`, `0f45741` | Confidence: High | Trust: Trusted
- 2026-02-10 | Confirm before clearing report export queue | Prevent accidental loss of the report clip queue during matchday workflows; keep behavior simple and local-only | Evidence: `src/ui/web/src/components/ReportQueue.tsx`, `src/ui/web/src/components/ReportQueue.test.tsx`; `npm test` (pass) | Commit: `bcf54e1` | Confidence: High | Trust: Trusted
- 2026-02-10 | Add Settings backup/restore for local AFM data | Reduce fear-of-loss for operators by offering a versioned JSON backup/restore of all persisted `afm.*` keys, plus a restore that reloads to rehydrate contexts | Evidence: `src/ui/web/src/utils/backup.ts`, `src/ui/web/src/utils/backup.test.ts`, `src/ui/web/src/pages/Settings.tsx`; `npm run verify` (pass) | Commit: `625e11c`, `b8b0eb3` | Confidence: High | Trust: Trusted

## Mistakes And Fixes
- Zip import unit test initially failed in Node when feeding a `Blob` directly into JSZip.
  Root cause: JSZip load path is sensitive to `Blob` implementations in non-browser environments.
  Fix: normalize zip inputs to `ArrayBuffer` before calling `JSZip.loadAsync`.
  Prevention rule: when writing cross-env import/export utilities, add a unit test that exercises the Node path and normalize inputs at boundaries.
- ClipModal triggered a hook-order crash when opening a clip (conditional return before all hooks).
  Root cause: early return prevented some hooks from running on initial render; later renders added hooks.
  Fix: move “no clip” return after hooks and guard inside effects/memos.
  Prevention rule: add/keep at least one UI integration smoke test that opens the ClipModal and navigates routes.
- UI smoke test flaked in GitHub Actions (missing timeline entry / duplicate clip title match).
  Root cause: advancing fake timers outside React `act()` and relying on unscoped `getByText()` queries made the test timing-sensitive and vulnerable to duplicate text nodes (timeline vs modal header).
  Fix: wrap timer advancement in `act()`, clear storage via `localStorage.clear()`, retry the timeline lookup with bounded advances, and assert on the modal header via role/level.
  Prevention rule: when using fake timers in React tests, advance inside `act()` and prefer role-scoped queries over global text matches for content that can appear in multiple places.

## Verification Evidence
- 2026-02-11: `gh issue list --state open --limit 200 --json number,title,author,labels,url` (pass: `[]`, no open trusted-author issues)
- 2026-02-11: `gh run view 21854594556 --log-failed` (pass: identified historical flaky smoke failure context in `App.smoke.test.tsx`)
- 2026-02-11: `gh run list --limit 10 --json databaseId,headSha,status,conclusion,workflowName,createdAt,url` (pass: latest CI runs are `success`; only 21854594556 failed historically)
- 2026-02-11: `npm run typecheck:strict` (pass)
- 2026-02-11: `npm run test` (pass: 13 files, 47 tests)
- 2026-02-11: `npm run verify` (pass: typecheck + tests + build)
- 2026-02-11: `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` + `curl -I http://127.0.0.1:4173/ | head -n 1` (pass: `HTTP/1.1 200 OK`)
- `npm run typecheck` (pass)
- `npm test` (pass)
- `npm run build` (pass)
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` (pass: server started)
- `curl -I http://127.0.0.1:4173/ | head` (pass: `HTTP/1.1 200 OK`)
- `npm audit --audit-level=moderate` (pass: 0 vulnerabilities)
- 2026-02-10: `npm run verify` (pass: typecheck + 35 tests + build)
- 2026-02-10: `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` (pass: served at `http://127.0.0.1:4173/`)
- 2026-02-10: `curl -I http://127.0.0.1:4173/ | head` (pass: `HTTP/1.1 200 OK`)
- 2026-02-10: `gh run watch 21854691755 --exit-status` (pass: CI green)

## Gap Map (Cycle 1)
- Missing (parity): telestration/drawing tools on clips; zip-style export bundles for offline sharing; invite/collaboration entrypoint beyond a stub button.
- Weak (parity): safe report-pack import ergonomics (now has explicit review + overlap policies + one-step undo, but lacks clip-level preview and multi-step history); analyst tagging speed/keyboard depth (improved with Enter-to-add, multi-select bulk actions, and recent-tag hotkeys; still lacks true live-capture tagging ergonomics and shared timelines).
- Parity (improving): permissioned share flows (now has presets + expiry + manifest, but no server-backed revocation/audit).
- Differentiator candidates: confidence-gated “evidence-first” recommendations with coach/analyst dual surfaces and fast pack generation.
