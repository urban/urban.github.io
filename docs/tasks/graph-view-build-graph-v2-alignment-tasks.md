---
name: graph-view-build-graph-v2-alignment-tasks
created: 2026-03-11
updated: 2026-03-11
source_plan: docs/plans/graph-view-build-graph-v2-alignment-plan.md
---

## Task Summary

- Parent plan: `docs/plans/graph-view-build-graph-v2-alignment-plan.md`
- Scope: update `@urban/graph-view` so decode, rendering, CLI, tests, and docs match the current `@urban/build-graph` v2 snapshot contract.
- Tracking intent: execute thin end-to-end slices that each leave graph-view able to read and present one more real build-graph behavior.

## Stream Groups

### Snapshot Contract Intake

Objective: make graph-view accept real build-graph v2 snapshots at the read boundary and top-level API.

#### Task GV-BG2-1

- Title: Decode current build-graph snapshot root
- Status: Not started
- Blocked by: None
- Plan references:
  - `Snapshot Contract Intake`
- What to build: extend graph-view snapshot schemas and decode tests so a real v2 snapshot with `schemaVersion`, `indexes`, and richer note nodes is accepted end to end through `decodeGraphSnapshot`.
- Acceptance criteria:
  - A fixture shaped like current build-graph output decodes successfully in graph-view tests.
  - Schema-invalid snapshots missing required v2 root fields still fail validation.
- Notes:
  - Use build-graph README/tests as the consumer contract source, not `node_modules`.

#### Task GV-BG2-2

- Title: Freeze exported v2 schema surface
- Status: Not started
- Blocked by: GV-BG2-1
- Plan references:
  - `Snapshot Contract Intake`
- What to build: update top-level graph-view exports and public API tests so newly required v2 schema pieces remain accessible without changing established CLI/render entry points.
- Acceptance criteria:
  - Public API tests cover the intended schema/export additions.
  - No existing top-level graph-view entry point is removed during the schema upgrade.
- Notes:
  - Keep change surgical; export only contract pieces graph-view actually owns.

### Route-Aware Rendering

Objective: make rendered graphs readable and deterministic for both source-path and canonical-route snapshots.

#### Task GV-BG2-3

- Title: Render note labels from route-aware metadata
- Status: Not started
- Blocked by: GV-BG2-1
- Plan references:
  - `Route-Aware Rendering`
- What to build: implement deterministic note-label selection that prefers `title`, then `label`, and falls back cleanly for legacy or minimal note nodes.
- Acceptance criteria:
  - Mermaid output for canonical-route snapshots uses `title` when present and otherwise uses `label` before fallback fields.
  - Source-path snapshots still render stable output without requiring every optional note field.
- Notes:
  - Remaining fallback order after `title` then `label` should be fixed in tests during implementation.

#### Task GV-BG2-4

- Title: Cover identity-mode rendering parity
- Status: Not started
- Blocked by: GV-BG2-3
- Plan references:
  - `Route-Aware Rendering`
- What to build: add renderer and CLI fixtures for both source-path and canonical-route snapshots, including unresolved placeholders, to prove deterministic markdown/mermaid output across identity strategies.
- Acceptance criteria:
  - Tests verify stable output regardless of input ordering for both identity modes.
  - CLI output matches updated renderer expectations for at least one canonical-route snapshot.
- Notes:
  - Keep placeholders visually distinct exactly as today unless a failing fixture proves a contract issue.

### Consumer Compatibility and Docs

Objective: make the aligned contract explicit in docs and package verification.

#### Task GV-BG2-5

- Title: Publish v2 consumer guidance
- Status: Not started
- Blocked by: GV-BG2-2, GV-BG2-4
- Plan references:
  - `Consumer Compatibility and Docs`
- What to build: refresh README examples, snapshot contract docs, and migration notes so graph-view clearly states it consumes build-graph v2 snapshots and explains route-aware rendering behavior.
- Acceptance criteria:
  - README example JSON includes `schemaVersion` and `indexes`.
  - Docs explain the rendering label behavior and call out the pre-v2 incompatibility explicitly.
- Notes:
  - Keep guidance short; point to build-graph migration details where graph-view should not duplicate them.

## Dependency Map

- GV-BG2-1 -> None
- GV-BG2-2 -> GV-BG2-1
- GV-BG2-3 -> GV-BG2-1
- GV-BG2-4 -> GV-BG2-3
- GV-BG2-5 -> GV-BG2-2, GV-BG2-4

## Tracking Notes

- Active stream: Snapshot Contract Intake
- Global blockers: None
- TODO: Confirm: final note-label precedence for rendering once you review whether graph-view should prefer `label`, `title`, or a route/path fallback.
- TODO: Confirm: fallback order after `title` then `label` if snapshots omit both fields.
