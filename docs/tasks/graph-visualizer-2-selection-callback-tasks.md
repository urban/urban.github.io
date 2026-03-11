---
name: graph-visualizer-2-selection-callback-tasks
created: 2026-03-11
updated: 2026-03-11
source_plan: docs/plans/graph-visualizer-2-selection-callback-plan.md
---

## Task Summary

- Parent plan: `docs/plans/graph-visualizer-2-selection-callback-plan.md`
- Scope: add an optional typed host selection callback to `@urban/graph-visualizer-2`, wire it to real post-bootstrap selection transitions, and document/test the seam for vault-route consumers.
- Tracking intent: execute thin vertical slices that each leave the package able to expose, emit, or validate one more real host-selection behavior.

## Stream Groups

### Callback Contract

Objective: freeze a minimal public callback API that gives hosts stable note-vs-placeholder selection data without leaking reducer internals.

#### Task GV2-SC-1

- Title: Define typed selection callback payload + bootstrap option
- Status: Completed
- Blocked by: None
- Plan references:
  - `Callback Contract`
- What to build: add an optional bootstrap callback contract with a discriminated payload for `none`, `note`, and `placeholder` selection states, including navigation-relevant note metadata.
- Acceptance criteria:
  - Public package exports include the callback option and typed payload contract.
  - Note-node payload shape exposes stable navigation fields without requiring host parsing of raw snapshot JSON.
- Notes:
  - Keep the addition surgical; avoid exposing reducer or renderer internals.

### Selection Event Wiring

Objective: emit the typed host callback exactly once per real user-driven selection transition.

#### Task GV2-SC-2

- Title: Preserve snapshot node metadata for callback construction
- Status: Completed
- Blocked by: GV2-SC-1
- Plan references:
  - `Selection Event Wiring`
- What to build: keep the decoded snapshot node metadata available in graph data/runtime state so bootstrap can build typed selection payloads without reparsing or host-side inference.
- Acceptance criteria:
  - Graph bootstrap can map a selected node id back to its snapshot node kind and stable metadata.
  - Existing rendering/simulation behavior stays unchanged for hosts that do not use the callback.
- Notes:
  - Prefer a dedicated metadata map over widening simulation node state with unused fields.

#### Task GV2-SC-3

- Title: Wire selection transitions to host callback semantics
- Status: Completed
- Blocked by: GV2-SC-2
- Plan references:
  - `Selection Event Wiring`
- What to build: thread selection-change commands through app-state/bootstrap so the host callback fires after reducer resolution for actual selection changes only, never on initial bootstrap selection.
- Acceptance criteria:
  - Re-selecting the same node produces no callback.
  - Initial bootstrap with `selectedNodeId` does not emit a callback before user interaction.
- Notes:
  - Callback ordering should remain reducer-driven, not pointer-event-driven.

### Host Integration Readiness

Objective: make the new seam consumable and regression-covered for direct and browser bootstrap callers.

#### Task GV2-SC-4

- Title: Document and test host selection callback behavior
- Status: Completed
- Blocked by: GV2-SC-3
- Plan references:
  - `Host Integration Readiness`
- What to build: add focused tests and package docs/example usage covering note, placeholder, repeated-selection, and no-initial-callback behavior.
- Acceptance criteria:
  - Tests prove typed callback payload behavior and startup suppression semantics.
  - Package docs/examples show how a website host can navigate from note-node selection while browser auto-bootstrap remains optional.
- Notes:
  - Keep docs short and package-local.

## Dependency Map

- GV2-SC-1 -> None
- GV2-SC-2 -> GV2-SC-1
- GV2-SC-3 -> GV2-SC-2
- GV2-SC-4 -> GV2-SC-3

## Tracking Notes

- Active stream: None
- Global blockers: None
- TODO: Confirm: None.
