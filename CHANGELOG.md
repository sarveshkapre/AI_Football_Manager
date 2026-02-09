# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]
### Added
- Architecture overview documentation
- MVP user stories and acceptance criteria
- Draft MVP backlog and milestones
- Source layout scaffolding under `src/`
- Minimal UI prototype under `src/ui/web`
- React + Vite web UI scaffold with interactive mode toggle
- Auto-rotating live state mock data for Coach Mode
- App shell with Coach, Analyst, Reports, and Settings views
- Mock API layer for live state, cards, timeline, overlays, and reports
- Lightweight live store with shared status indicator
- Clip viewer modal and live event toast feed
- Clip library view and storyboard builder in Analyst Mode
- Report export queue and keyboard shortcuts
- Live event feed panel and signal trend charts in Coach Mode
- Draft report view with queue auto-fill and persisted storyboards
- Drag-and-drop ordering for report queue and signal history panel
- UI density toggle and report exports (JSON/CSV)
- Presentation cover preview and evidence engagement widget
- Notification cadence and auto-refresh settings
- Storyboard drag ordering and engagement stream
- Draft report cover export and engagement stream wiring
- Draft report metadata fields and clip annotations
- Pack bundle export, clip labels, and audit log
- Draft report share link, notes export, and cover image download
- Ingest view with upload queue, alignment, segment builder, and pipeline status
- Coach Mode fast clipping controls and live capture logging
- Role-based access presets and view gating
- Clip export logging from the evidence modal
- Analyst timeline filters, manual tags, and highlight markers
- Segment report generator with auto summary and evidence clips
- Presentation HTML pack export and preview
- Analyst data export bundle and broadcast pack preview
- Ask the match Q&A flow with evidence clips and confidence gating
- Minimap snapshot preview in Analyst Mode
- Minimap timeline scrubber with play/pause
- Evidence package export manifest
- Live ingest simulation toggle and phase cycling
- Coach Mode now reflects ingest simulation state
- Library saved searches and playlist export
- Analyst signal quality dashboard and snapshot cues
- Coach evidence replay carousel with quick labels and notes
- Print-friendly presentation pack view
- Ingest-to-report handoff for ready segments
- Analyst insight packs saved from Ask-the-match
- Coach replay clips can be queued to reports
- Insight packs can be queued to reports
- Auto-generate segment report after upload completes
- Staff invite modal (email + role preset) with local persistence and audit logging
- Telestration-lite drawing (freehand + arrow) on evidence clips, persisted per clip and exported in packs
- CI workflow for typecheck, tests, and production build on push/PR
- Verification guide for local smoke and CI command parity (`docs/VERIFICATION.md`)
- Vitest test suite covering time parsing, storage guards, and segment report generation
- Runtime storage guards and validated hydration across UI context stores
- Global UI ErrorBoundary with recovery actions (reload / reset local AFM storage)
- Aggregated `npm run verify` script for typecheck + tests + build parity with CI
- Project memory and incident tracking docs (`PROJECT_MEMORY.md`, `INCIDENTS.md`)

### Changed
- Ingest now validates segment windows and manual alignment offsets with inline error messaging
- Ingest upload simulation timers are cleaned up on unmount, and report auto-open uses latest segment state
- Segment report generation moved to a reusable utility for easier testing and maintenance
- Time parsing is stricter for malformed values and out-of-range seconds
- Audit, labels, and annotations updates now use functional state writes to avoid stale-update races
- Hash route navigation now respects access settings and auto-redirects to the first permitted view
- Saved library searches are deduplicated, recency-ordered, and capped to prevent list bloat
- In-app hotkey/help modal (`?`) plus a first-run onboarding tour (skippable)
- Draft report Share pack now supports permission presets, expiring links, and a downloadable bundle manifest
- Analyst timeline filters now persist across sessions, and manual tagging supports Enter-to-add for faster workflows
- Modals now trap focus, restore focus on close, and support Escape and click-outside close for better keyboard accessibility
- Clip overlay toggles now affect queued clips and clip exports (no stale overlay state)

## [0.1.0] - 2026-02-04
### Added
- Initial repository scaffolding
- Product Requirements Document (`docs/PRD.md`)
- Baseline `README.md` and `AGENTS.md`
