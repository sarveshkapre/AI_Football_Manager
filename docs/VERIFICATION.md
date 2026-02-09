# Verification Guide

Use this checklist before pushing changes to `main`.

## Local checks
1. Install deps: `npm install`
2. Typecheck: `npm run typecheck`
   Optional (stricter unused checks): `npm run typecheck:strict`
3. Unit tests: `npm run test`
4. Production build: `npm run build`

Shortcut: `npm run verify` runs typecheck + tests + build.

## Local smoke path
1. Build (if needed): `npm run build`
2. Start preview server: `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`
3. Verify app responds: `curl -I http://127.0.0.1:4173/`
4. Stop the preview server.

Expected smoke result: `HTTP/1.1 200 OK`.

## CI checks
GitHub Actions runs the same verification steps via `.github/workflows/ci.yml`:
- `npm ci`
- `npm run verify`
