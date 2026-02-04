# Source Layout

This directory will contain the implementation. The structure mirrors the architecture boundaries.

- `src/ingest`: video upload, decode, and segment alignment
- `src/perception`: detection, tracking, field registration
- `src/state`: game-state model and signal quality
- `src/tactics`: tactical event detection and interpretation
- `src/recommendations`: adjustment generation and confidence gating
- `src/evidence`: clip generation and overlay rendering
- `src/api`: service interfaces and API handlers
- `src/ui`: coach and analyst surfaces
- `src/shared`: shared utilities and schema definitions

Implementation language and runtime will be selected once the prototype stack is finalized.
