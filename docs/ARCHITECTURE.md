# Architecture Overview

This document describes the intended system architecture for AI Football Manager. It is a living design and will be updated as implementation decisions are made.

## Goals
- Low-latency tactical insights from broadcast video
- Evidence-first outputs with confidence gating
- Coach and analyst workflows that mirror existing matchday practices
- Clear separation between perception, state modeling, and prescriptive reasoning

## High-level system
```
[Video Upload/Stream]
        |
        v
[Ingest + Decode] --> [Segmenter] --> [Perception Pipeline]
                                   |        |
                                   |        v
                                   |   [Tracking + Detection]
                                   |        |
                                   v        v
                               [Game-State Model]
                                   |
                                   v
                           [Tactical Interpreter]
                                   |
                                   v
                        [Recommendation Engine]
                                   |
                                   v
                   [Evidence Packager + Overlays]
                                   |
                                   v
                          [Coach/Analyst UI]
```

## Core components

### 1. Video ingest
- Accepts full-match or 15–20 minute segments
- Optional manual minute alignment when scoreboard OCR is unreliable
- Handles single broadcast angle; later extension to multi-angle

### 2. Perception pipeline
- Player and ball detection
- Player tracking and trajectory smoothing
- Team assignment and side inference
- Field registration for spatial normalization
- Occlusion handling with confidence degradation

### 3. Game-state model
- Maintains continuous state: phase, shape, line heights, compactness, territory
- Aggregates windowed metrics and transitions
- Emits “signal quality” based on visibility, occlusion, and camera cuts

### 4. Tactical interpreter
- Detects patterns: press triggers, overloads, switches, progression channels
- Identifies shifts: formation changes, line height changes, tempo changes
- Produces evidence-backed claims with confidence reasons

### 5. Recommendation engine
- Generates 1–3 adjustment options with tradeoffs
- Ties each suggestion to evidence clips and overlays
- Applies conservative language at low confidence

### 6. Evidence packager
- Creates 10–15s clips per claim/suggestion
- Renders overlays: spacing box, lines, ball trajectory, entry markers
- Exports clips, tags, and summary JSON/CSV

### 7. UI surfaces
- Coach Mode: rapid “Now” and “Do next” cards
- Analyst Mode: timeline, tagging, overlays, dashboards, chat
- Report packs: segment + full match summaries

## Data flow and latency targets
- Segment upload to first “Now” card: < 2 minutes
- “Now” refresh cadence: 30–60 seconds or on detected shift
- Evidence clips produced within 60–90 seconds after detection

## Confidence gating
- Every claim and recommendation includes:
  - Confidence score
  - Reason (e.g., number of tracked players, repeated observations)
  - Signal quality badge (High/Med/Low)
- Low confidence suppresses strong prescriptions

## Storage model (proposed)
- Raw video storage (original + decoded segments)
- Derived artifacts (tracks, overlays, clips)
- Structured data (tactical events, recommendations, tags)

## API boundaries (proposed)
- `POST /ingest` video upload + metadata
- `GET /state` latest tactical state + signal quality
- `GET /recommendations` adjustments with evidence links
- `GET /clips/:id` evidence clips and overlays
- `POST /tags` manual tagging events

## Open questions
- Best tracking stack for broadcast-only (hybrid re-id vs team-color heuristics)
- Model selection for tactical interpreter (rules + ML hybrid vs pure ML)
- How to generalize overlays across different broadcast graphics packages
