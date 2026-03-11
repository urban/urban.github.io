---
name: graph-visualizer-2-selection-callback-plan
created: 2026-03-11
updated: 2026-03-11
---

## Execution Summary

Add an optional node-selection callback seam to `@urban/graph-visualizer-2` so host applications can react to user-driven selection changes and use them for behaviors such as route navigation on vault pages.

## Scope Alignment

- User Stories: user request on 2026-03-11 to let website vault pages navigate from graph node selection.
- Requirements: derive a package-level callback capability from the existing `selection/changed` transition without requiring hosts to fork package internals or reimplement pointer handling.
- Technical Design: current `packages/graph-visualizer-2/src/state.ts`, `app-state.ts`, `bootstrap.ts`, and `main.ts` selection pipeline already emits deterministic selection transitions and is the source-of-truth integration seam.
- In-scope implementation objective: expose a stable callback contract for selection changes, thread it through bootstrap/runtime wiring, and preserve current default behavior when the callback is omitted.

## Implementation Streams

### Callback Contract

- Objective: define the smallest public API addition that lets hosts observe selection changes with enough context to decide whether to navigate.
- Implements:
  - user request on 2026-03-11
  - current `selection/changed` package transition contract
- Notes: callback payload should be typed and discriminated so note-node navigation is representable without unsafe host inference from placeholder nodes.

### Selection Event Wiring

- Objective: route real selection changes from app-state reduction into the new host callback without changing current gesture semantics.
- Implements:
  - `packages/graph-visualizer-2/src/state.ts`
  - `packages/graph-visualizer-2/src/app-state.ts`
  - `packages/graph-visualizer-2/src/bootstrap.ts`
- Notes: fire only on actual post-bootstrap selection transitions; do not invoke the callback merely because an initial selected node was provided at startup.

### Host Integration Readiness

- Objective: make the callback usable from both direct bootstrap callers and browser auto-bootstrap consumers where applicable.
- Implements:
  - `packages/graph-visualizer-2/src/main.ts`
  - downstream website vault-route integration need
- Notes: keep the callback optional; no routing opinion should be embedded in the package itself.

## Work Breakdown

### Callback Contract

- [x] Define a new optional bootstrap option such as `onSelectionChange`.
- [x] Define a discriminated callback payload that distinguishes note-node selection from placeholder-node selection and includes stable navigation-relevant fields for note nodes.
- [x] Define callback semantics for repeated selection of the same node, placeholder selection, and empty/null selection states.

### Selection Event Wiring

- [x] Preserve snapshot node metadata needed for callback payload construction instead of discarding it during graph-data creation.
- [x] Map the existing `selection/changed` command/transition stream to callback invocation in the bootstrap runtime.
- [x] Ensure callback invocation happens after state transition resolution and only when the selected node actually changes.
- [x] Ensure bootstrap initialization with `selectedNodeId` does not emit a synthetic navigation-triggering callback.

### Host Integration Readiness

- [x] Export the new callback types from the package public surface.
- [x] Update package usage docs/examples to show website-style navigation handling from note-node selection.
- [x] Keep browser auto-bootstrap behavior unchanged when no callback is configured.

## Dependency and Sequencing Strategy

- Prerequisites: existing `selection/changed` transition flow in `state.ts` and `app-state.ts`.
- Sequencing notes: lock callback payload shape first, then preserve the required node metadata in graph-data creation, then wire bootstrap invocation and docs/tests.
- Coordination risks: if payload shape is underspecified, website integration will reintroduce snapshot-coupled parsing outside the package.

## Validation Checkpoints

- `bun --filter @urban/graph-visualizer-2 test`
- Add targeted tests for callback firing on user-driven selection changes.
- Add targeted tests proving no callback fires on initial bootstrap selection.
- Add targeted tests for placeholder-node and repeated-selection behavior.
- Manual smoke verification in package dev runtime that selecting a node triggers host callback exactly once per selection change.

## Risks and Mitigations

- Risk: callback payload is too thin, forcing hosts to inspect internal graph state or reparsed snapshot JSON.
- Mitigation: expose a typed selection event payload with note-vs-placeholder discrimination and navigation-relevant note fields.
- Risk: callback fires during startup and causes unwanted host redirects.
- Mitigation: define and test callback semantics as transition-driven only after bootstrap initialization completes.
- Risk: callback wiring leaks package internals into public API.
- Mitigation: expose only stable event payload/types and keep reducer/simulation internals private.

## Progress Tracking

- Status: Completed
- Active stream: None
- Notes: Implemented typed selection callback exports, snapshot metadata retention, callback command wiring, focused tests, and package usage docs on 2026-03-11.

## Further Notes

- Expected handoff: `@urban/graph-visualizer-2` exposes an optional typed selection callback, hosts can navigate from note-node selection without parsing package internals, and current runtime behavior stays unchanged when the seam is unused.
- Out of scope: embedding router dependencies in the package, automatic navigation behavior inside the package, changing snapshot schema, or adding a broader event bus.
