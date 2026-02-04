# AI Football Manager

AI Football Manager is a broadcast-video-first decision-support copilot for elite soccer clubs. It ingests broadcast video (live or uploaded segments), builds a live game-state model, and delivers coach-ready tactical diagnosis and concrete adjustments with evidence (clips + overlays) and confidence.

## What this repo contains
- Product requirements and roadmap documentation
- Architecture and user-story definitions
- Early system design notes and implementation scaffolding (as we build)

Start here: `docs/PRD.md`.

## Product snapshot
- Target customers: top-tier professional clubs (e.g., Arsenal FC)
- Primary buyers: head of performance, head coach, lead analyst
- Primary users: coaches on the bench and analysts in the analyst room

## MVP scope (broadcast upload)
- Upload full match or 15–20 minute segment (with optional manual minute alignment)
- Coach Mode: “Now” cards, “Do next” adjustments, and evidence-backed key moments
- Analyst Mode: tactical timeline, overlays, estimated dashboards, and “Ask the match” chat
- Reports: segment report, full match report, and exportable packs
- Workflow parity: fast clipping, tagging, telestration-lite overlays, coach vs analyst roles

## Principles
- Evidence over eloquence: every claim must cite supporting clips
- Coach-ready by default; deep analysis one tap away
- Confidence gating and transparent signal quality

## Non-goals (MVP)
- Opta/StatsBomb-grade event stats from broadcast alone
- Perfect player identification by name
- Replacing coaches’ judgment or medical decisions

## Success metrics
- Time-to-first-useful-insight: < 2 minutes after upload
- Insight usefulness: % of matches where staff uses a recommendation
- Evidence engagement: clip opens per suggestion
- Post-match productivity: faster review pack creation

## Repo conventions
- Keep `CHANGELOG.md`, `README.md`, and `AGENTS.md` accurate and up to date.
- Record decisions and product changes in `CHANGELOG.md`.

## Docs
- `docs/PRD.md` — product requirements
- `docs/ARCHITECTURE.md` — system architecture overview
- `docs/USER_STORIES.md` — MVP user stories and acceptance criteria
- `docs/MVP_BACKLOG.md` — draft backlog and milestones

## UI prototype
- React + Vite prototype under `src/ui/web`

## Development (web UI)
- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Vite root is set to `src/ui/web`
- Navigate using hash routes: `#coach`, `#analyst`, `#reports`, `#settings`

## Data & state (prototype)
- Mock API lives in `src/ui/web/src/api/mock.ts`
- Live updates use a lightweight store in `src/ui/web/src/store/liveStore.ts`
- Clip modal and live event toasts use `src/ui/web/src/context/ClipContext.tsx`

## Status
Early-stage product definition. Implementation will follow the PRD.

## Contributing
See `AGENTS.md` for agent and contributor guidance.
