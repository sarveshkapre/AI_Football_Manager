# MVP User Stories and Acceptance Criteria

## Coach Mode

### 1. Rapid situational awareness
As a coach on the bench, I want a 2–4 bullet “Now” card so I can understand the current tactical state in under 5 seconds.

Acceptance criteria:
- Updated every 30–60 seconds or on detected shift
- Each bullet includes a confidence score and signal quality badge
- Every bullet links to at least one supporting clip

### 2. Actionable adjustments
As a coach, I want 1–3 “Do next” options with tradeoffs so I can decide on a low-risk change quickly.

Acceptance criteria:
- Each option includes steps, rationale, risk/tradeoff, and confidence
- Each option cites 1–3 evidence clips (10–15 seconds)
- Low confidence suppresses strong prescriptive language

### 3. Key moments review
As a coach, I want to quickly review the latest press breaks, overloads, and dangerous turnovers.

Acceptance criteria:
- A key moments strip shows the last 3–5 tactical events
- Each event opens the associated clip and overlay

## Analyst Mode

### 4. Tactical timeline
As an analyst, I want an auto-detected timeline with tags so I can build a coherent narrative quickly.

Acceptance criteria:
- Timeline shows auto-detected tactical events
- Manual tagging and quick hotkeys are available
- Tags are searchable and filterable

### 5. Overlay-driven review
As an analyst, I want overlays (spacing box, lines, trajectory) so I can explain patterns to coaches.

Acceptance criteria:
- Overlays can be toggled per clip
- Overlays are exportable with the clip
- Overlay rendering time < 10 seconds per clip

### 6. Ask the match
As an analyst, I want to ask questions about patterns and get evidence-linked answers.

Acceptance criteria:
- Answer includes a short response and 1–3 clip links
- If evidence is insufficient, the system responds with low confidence and a reason

## Reports and exports

### 7. Segment report
As a staff member, I want a segment report after uploading 15–20 minutes so I can share findings quickly.

Acceptance criteria:
- Includes “what happened,” repeat patterns, recommended adjustments, and clip reel
- Exportable as clips + JSON/CSV summary

### 8. Full match report
As a staff member, I want a full match report to review turning points and phases.

Acceptance criteria:
- Includes phases, turning points, patterns, and shareable playlist
- Includes signal quality summary

## Workflow parity

### 9. Fast clipping
As an analyst, I want one-tap last 10s/20s/45s clips so I can capture moments instantly.

Acceptance criteria:
- One-tap capture from live or recorded video
- Custom in/out points supported

### 10. Roles and permissions
As a head of performance, I want coach vs analyst views so sensitive analysis is controlled.

Acceptance criteria:
- Role-based access to views and features
- Audit trail for shared clips and reports
