# Incidents

This file captures real failures, root-cause analysis, and prevention rules.

## Template
- **Date**: YYYY-MM-DD
- **Summary**:
- **Impact**:
- **Root cause**:
- **Fix**:
- **Prevention rule(s)**:
- **Evidence**: commands run, tests, links to commits/files

## Log

- **Date**: 2026-02-09
- **Summary**: ClipModal violated React Rules of Hooks due to an early return, which could crash the UI when opening an evidence clip (ErrorBoundary screen).
- **Impact**: High risk of runtime crash during a core workflow (opening/annotating clips), especially in strict/dev environments where React surfaces hook-order bugs.
- **Root cause**: `ClipModal` returned early when `clip` was null, but declared additional hooks (`useMemo`, `useEffect`) after that return; once a clip was opened, those hooks executed and changed hook order.
- **Fix**: Refactored `ClipModal` so all hooks run unconditionally and the “no clip” return happens after hooks; added a UI smoke test that opens a clip modal to prevent regressions.
- **Prevention rule(s)**:
  - Never place conditional returns before all hooks in a component; guard inside hooks and only return after hooks.
  - Keep at least one integration smoke test that exercises high-frequency UI flows (open clip modal, navigate routes).
- **Evidence**: `npm run verify` (pass), `src/ui/web/src/components/Modal/ClipModal.tsx`, `src/ui/web/src/App.smoke.test.tsx`, commits `b1ce305`, `4d5faeb`.

- **Date**: 2026-02-10
- **Summary**: GitHub Actions CI failed on the UI smoke test due to brittle timing and unscoped text matching.
- **Impact**: Main branch CI red; risk of blocking further shipping and masking real regressions.
- **Root cause**: `App.smoke.test.tsx` advanced fake timers by a fixed amount without wrapping in React `act()`, and used broad `getByText()` assertions that were sensitive to render timing and duplicate text nodes (timeline + modal).
- **Fix**: Stabilized the smoke test by wrapping timer advancement in `act()`, clearing storage via `localStorage.clear()`, retrying the timeline lookup with bounded advances, and asserting on the modal header via role/level (`h3`) to avoid duplicate matches.
- **Prevention rule(s)**:
  - When using fake timers in React tests, advance timers inside `act()` and avoid fixed “sleep” assumptions where possible.
  - Prefer role-based, scoped queries (modal heading) over global `getByText()` for content that can appear in multiple places.
  - Treat CI-only failures as flakiness until proven otherwise; add bounded retries or deterministic flushing to eliminate timing sensitivity.
- **Evidence**: failing run `gh run watch 21854594556 --exit-status` (failed), fix commit `894fe6b`, succeeding run `gh run watch 21854691755 --exit-status` (pass), `npm run verify` (pass).

- **Date**: 2026-02-11
- **Summary**: New smoke coverage for Analyst bulk-edit undo initially failed due ambiguous selectors and repeated text nodes.
- **Impact**: Local verification failed; risk of reintroducing flaky CI if assertions remain global and non-scoped.
- **Root cause**: Test used global `getByText`/`getByPlaceholderText` on labels that appear in multiple UI regions and did not explicitly clean DOM between cases.
- **Fix**: Scoped the test to `.tagging-panel` with `within(...)`, switched to `queryAllByText` where duplicates are expected, and added explicit `cleanup()` in `afterEach`.
- **Prevention rule(s)**:
  - Scope smoke-test selectors to the closest feature container; avoid global selectors for reused labels.
  - Use `queryAllBy*` for intentionally repeated text and assert counts/deltas rather than uniqueness.
  - Add explicit cleanup in smoke suites when multiple integration cases run in the same file.
- **Evidence**: `src/ui/web/src/App.smoke.test.tsx`, `npm test` (pass), `npm run verify` (pass).

### 2026-02-12T20:01:31Z | Codex execution failure
- Date: 2026-02-12T20:01:31Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-AI_Football_Manager-cycle-2.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:05:00Z | Codex execution failure
- Date: 2026-02-12T20:05:00Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-AI_Football_Manager-cycle-3.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:08:29Z | Codex execution failure
- Date: 2026-02-12T20:08:29Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-AI_Football_Manager-cycle-4.log
- Commit: pending
- Confidence: medium
