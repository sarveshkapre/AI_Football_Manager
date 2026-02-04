# PRD — AI Football Manager (broadcast-video-first)

## Product vision
Create a matchday decision-support copilot for elite soccer clubs that watches broadcast video (live or uploaded segments), builds a live game-state model, and delivers coach-ready tactical diagnosis and concrete adjustments with evidence (clips + overlays) and confidence.

## Target customer
Top-tier professional clubs (example: Arsenal FC).

- Primary buyers: head of performance, head coach, lead analyst
- Primary users: coaches on the bench + analysts in the analyst room

## Problem statement
Matchday decision cycles are too slow and too manual. Analysts and coaches have limited time to notice patterns, validate them with evidence, and translate them into actionable, low-risk in-game adjustments. Existing video-analysis stacks are strong at capture, tagging, and presentation, but the last mile (tactical interpretation + prescriptive options, fast) is still human-heavy.

## High-level goals
1. Reduce time-to-insight: detect tactical patterns and shifts within minutes (or within a 15–20 minute clip).
2. Convert insight to action: generate 1–3 adjustment options with tradeoffs and confidence.
3. Evidence-first: every claim is backed by a tap-to-view clip and overlay.
4. Workflow parity: match the matchday workflows clubs already rely on (tagging, clips, sharing, presentations).
5. Broadcast-grade storytelling: generate analysis packages that can look like studio breakdowns (clip sequences + overlays).

## Non-goals for MVP
- Accurate Opta/StatsBomb-grade event stats (pass completion, xG) from broadcast video alone
- Perfect player identification by name
- Replacing coaches’ judgment
- Making medical/fitness decisions

## Product principles
- Evidence > eloquence. No “confident nonsense.”
- If signal quality is low (off-camera, occlusion, cuts), the UI must show lower confidence and avoid strong claims.
- Short, coach-usable outputs by default; depth is one tap away.
- No imitation of any specific commentator’s voice; offer original style presets (cinematic / neutral analyst / ultra-concise bench mode).

## Core use cases
1. Upload 15–20 minute segment (training, opponent scouting, or last phase of match) → tactical read + clips + recommended adjustments.
2. Upload full match → post-match report and clip reel; plus “what changed at minute X” exploration.
3. Live match stream (roadmap) → real-time coach mode with low-latency suggestions.

## Competitive baseline we must meet (table-stakes)
Clubs already use platforms such as Hudl Sportscode for live capture, interactive reports linked to video, shareable analysis, and telestration/graphics.

They also use systems like Catapult Pro Video for multi-angle capture/sync/livestream, dataset-to-video integration, third-party dataset connectivity, and live-session automation templates.

For matchday event + stats context (when data feeds exist), StatsBomb’s live analysis platform provides detailed match event data and team/player statistics used by coaches/managers.

Broadcast analysis has moved toward tracking-driven overlays and narrative breakdowns (example: Premier League Productions’s Data Zone with Genius Sports powered by Second Spectrum).

References:
- [Hudl Sportscode](https://www.hudl.com/products/sportscode)
- [Catapult Pro Video](https://www.catapult.com/solutions/pro-video)
- [StatsBomb Live Analysis Platform](https://live-data-api-guide.statsbomb.com/)
- [Genius Sports Data Zone announcement](https://www.geniussports.com/newsroom/premier-league-productions-partners-with-genius-to-deliver-ground-breaking-premier-league-data-zone/)

## Positioning / differentiation
Where existing tools end at “here’s video + tags + charts,” AI Football Manager adds an always-on tactical interpreter and prescriptive layer: what’s happening, why it’s happening, and what you can change right now—each backed by clips and overlays, and scored by confidence.

## MVP scope (must work from broadcast video upload)
### Input
- Upload full match or partial clip (15–20 minutes)
- Optional: user sets “clip starts at match minute X” if scoreboard OCR is unreliable

### Core outputs
A) Coach Mode (touchline)
- “Now” card: 2–4 bullets describing current tactical state (shape tendencies, press/progression patterns, transition risk), updated every 30–60 seconds or on detected shifts
- “Do next” cards: 1–3 adjustment options, each with: steps, rationale, risk/tradeoff, confidence, and 1–3 supporting clips (10–15s)
- “Key moments” strip: press beaten, overload created, dangerous turnover, set-piece sequence, big chance sequence—tap to replay

B) Analyst Mode (deep analysis + content creation)
- Timeline with auto-detected tactical events + manual tagging and quick hotkeys
- Video player with overlays: team spacing/compactness box, estimated lines (def/mid/att), ball trajectory, territory zones, entry markers
- Dashboards derived from video (clearly labeled “estimated”): territory proxy, final-third/box entries, turnovers by zone, switch frequency, transition frequency, press-proxy trend
- “Ask the match” chat: questions answered with a short response + links to the exact clips/overlays used as evidence

C) Reports and packages
- Segment report (for 15–20 min uploads): what happened in this segment, repeat patterns, recommended adjustments, clip reel
- Full match report (if full match uploaded): turning points, phases, patterns, and a shareable playlist
- Export: clips + tags + summary JSON/CSV, and a rendered presentation pack (clips + overlays) suitable for internal review

### Feature parity checklist (MVP)
- Fast clipping: last 10s/20s/45s + custom in/out; playlists; shareable packages
- Manual tagging + auto-suggested tags; searchable timeline
- Telestration-lite overlays (computed overlays) plus basic drawing tools (lines/arrows) for analyst presentations
- Roles: Coach view vs Analyst view permissions; comments/annotations on clips

## AI/GPT capabilities (MVP)
### Grounding rules
- The model is never allowed to assert facts that are not supported by the computed signals and/or the current clip
- Every suggestion must cite the evidence clips; every claim has a confidence score with a reason (e.g., “clear tracking for 9/11 players; repeated 3 times in 6 minutes”)

### Outputs
- Tactical diagnosis: what/why in coach-ready language
- Adjustments: 1–3 options with tradeoffs, and if-then triggers (e.g., “if they keep escaping through RB→8 channel, shift trap wide”)
- Conversational analysis: “why can’t we progress centrally,” “where are we overloaded,” “show last 3 times they broke the press,” each returning clips

## User experience requirements
- Coach Mode must be legible at a glance and usable in under 5 seconds per interaction
- Analyst Mode must make it faster to build a coherent narrative: auto-clips, overlay toggles, and storyboard playlists that resemble studio breakdowns
- The UI must always show signal quality (High/Med/Low) so staff knows when to trust the system

## Success metrics
- Time-to-first-useful-insight: < 2 minutes from upload completion (segment) to first “Now” card and first evidence clip
- Insight usefulness (staff rating): % of matches where staff saves/uses at least one recommendation card
- Evidence engagement: average clip opens per suggestion card (proxy for trust)
- Post-match productivity: reduction in time to assemble a review pack (baseline vs current workflow)

## Risks and mitigations
- Broadcast camera limitations (players off-screen): require confidence gating; encourage tactical-cam input when available; degrade gracefully to ball-near view only
- Hallucination risk: enforce evidence-linked outputs only; reject outputs without supporting clips; conservative language at low confidence
- Adoption risk: nail parity workflows first (clips/tagging/sharing), then layer AI; coaches must be able to ignore AI without losing utility

## Roadmap (toward a fully fledged platform)
- V1 (MVP): broadcast upload (15–20 min + full match), coach/analyst modes, auto-clips, overlays, evidence-grounded recommendations, report packs
- V2: live stream ingest + real-time collaboration workflows comparable to Sportscode live sharing/collaboration
- V3: data-feed integrations (tracking/event providers) for higher-fidelity metrics; richer dashboards and accuracy
- V4: broadcast pack generator: studio-ready sequences with overlays and narrative arcs (inspired by Data Zone-style viewing modes)
- V5: scouting/library connectors (video library ingestion and unified search) similar to workflows teams run with products like Wyscout
