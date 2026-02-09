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
