---
name: graph-visualizer
created: 2026-03-02
updated: 2026-03-02
---

## Problem Statement

Build new package `packages/graph-visualizer` that turns `@urban/build-graph` snapshot output into a standalone offline HTML page rendering an interactive force-directed graph in one `<canvas>`.

Nodes represent snapshot nodes (`note` and `placeholder`). Note labels are filename stems from `relativePath`. Edges represent snapshot connections. Hover behavior must match approved reference: highlight hovered node + 1-hop neighborhood, mute all else.

## Goals

- Add new package `packages/graph-visualizer`.
- Input contract is `@urban/build-graph` snapshot schema.
- Output is single standalone offline HTML file.
- Render with D3 force layout + Pixi canvas rendering.
- Show note titles from filename stem.
- Include placeholder nodes with distinct style.
- Hover highlights hovered node + directly connected nodes/edges only.
- Heavily leverage Effect v4, especially CLI.
- Use `effect/unstable/reactivity/Atom` + `AtomRegistry` for pointer/hover state.
- Provide both library API and CLI in v1.

## Non-Goals

- No excerpt-level nodes in v1.
- No network/CDN runtime dependencies.
- No multi-canvas or DOM-overlay labels in v1.
- No watch mode/live incremental ingest in v1.
- No replacing `packages/graph-view` in this work.

## Success Criteria

- `graph-visualizer <from> <to>` writes valid standalone HTML.
- HTML renders graph fully offline.
- Default view shows neutral styling for all nodes/edges.
- Hover state highlights exactly hovered node + 1-hop neighborhood, mutes others.
- Note labels derive from filename stem.
- Placeholder nodes render with distinct style and participate in neighborhood logic.
- Invalid input/path/decode failures return clear tagged errors.
- Unchanged input yields deterministic HTML output bytes.

## Approach

Use hybrid runtime architecture:

- Effect v4 at boundaries and orchestration (decode/model/CLI/errors).
- Imperative Pixi render loop for hot-path drawing.
- Atom-based reactive state graph for pointer/hover/derived highlight sets.
- D3 force simulation for node positions.
- Bundle runtime into generated HTML so artifact runs offline.

This balances Effect-heavy modeling with fast, simple render performance.

## Architecture and Components

- `packages/graph-visualizer/src/domain/schema.ts`
  - Re-export snapshot contract from `@urban/build-graph`.
- `packages/graph-visualizer/src/core/decode.ts`
  - Parse + validate `string | GraphSnapshot` at boundary.
  - Emit tagged parse/validation errors.
- `packages/graph-visualizer/src/core/model.ts`
  - Build render model from snapshot.
  - Derive note title from filename stem of `relativePath`.
  - Build adjacency index and referential integrity checks.
- `packages/graph-visualizer/src/core/render-html.ts`
  - Emit full standalone HTML doc with one `<canvas>`.
  - Embed serialized graph payload.
  - Embed bundled runtime JS (includes Pixi + D3 + app runtime).
- `packages/graph-visualizer/src/core/runtime.ts`
  - Browser runtime bootstrap.
  - D3 force simulation for positions.
  - Pixi scene graph and draw pipeline.
  - Atom writable/readable graph for pointer -> hover -> highlight derivations.
- `packages/graph-visualizer/src/cli/main.ts`
  - Effect CLI command (`graph-visualizer <from> <to>`).
  - FS read/decode/render/write orchestration only.
- `packages/graph-visualizer/src/index.ts`
  - Curated public API exports for decode/render/cli + tagged errors.

## Data Flow

1. CLI parses required args `from` and `to`.
2. CLI reads snapshot JSON from `from`.
3. Decode validates against imported snapshot schema.
4. Model builder normalizes nodes/edges, derives labels, builds adjacency map.
5. HTML renderer outputs standalone offline HTML with embedded payload/runtime.
6. Browser runtime initializes Pixi on single `<canvas>`.
7. D3 force simulation updates node positions.
8. Pointer events update Atom writable state (`pointerPosition`).
9. Atom derived state computes `hoveredNodeId`, `highlightSet`, muted/highlight styles.
10. Render loop reads derived state from `AtomRegistry` and draws frame.
11. Hover miss/no hover returns to default neutral style.

## Error Handling

Hard failures:

- CLI arg/path validation failures (`from` missing/not file, invalid `to` path).
- IO read/write failures.
- JSON parse failure.
- Schema validation failure.
- Model integrity failure (edge references missing node ids).

Browser runtime failures:

- Fail-fast init guard for missing canvas or malformed embedded payload.
- Render fallback text in-page + `console.error` for diagnostics.

Non-fatal behavior:

- Placeholder nodes are valid graph entities, not errors.
- Null hover state is normal base state.

## Testing Expectations

- Test runtime behavior, not static type guarantees.
- Decode tests:
  - valid object + valid JSON pass.
  - invalid JSON fails with parse tagged error.
  - schema-invalid payload fails with validation tagged error.
- Model tests:
  - note title derivation from filename stem.
  - placeholder inclusion.
  - missing edge endpoint fails fast.
  - deterministic normalization/order.
- HTML renderer tests:
  - exactly one `<canvas>`.
  - embeds payload + runtime.
  - deterministic output for unchanged input.
- Runtime behavior tests:
  - default neutral render state.
  - hover highlights only hovered + 1-hop neighborhood.
  - non-neighborhood nodes/edges muted on hover.
  - hover exit resets default view.
- CLI integration tests:
  - success path writes standalone HTML.
  - creates parent directories when needed.
  - expected failures for path/io/decode/model errors.

## Constraints and Assumptions

- Bun workspace + Effect v4 patterns.
- Standalone artifact must run with zero network.
- Output surface is single canvas.
- State management for pointer interaction uses Atom/AtomRegistry.
- v1 allows dynamic live force-settling per run; no fixed seed/tick coordinate lock required.

## Risks and Mitigations

- Risk: offline bundling inflates HTML size.
  - Mitigation: minified runtime bundle, keep payload compact.
- Risk: force layout instability across graph sizes.
  - Mitigation: fixed simulation params, deterministic preprocessing order.
- Risk: Atom + imperative render boundary drift.
  - Mitigation: isolate boundary in `runtime.ts`, behavior tests for hover/muting invariants.
- Risk: browser perf degradation on large graphs.
  - Mitigation: Pixi batching, text draw constraints, configurable simulation cooldown.

## Dependencies

- `effect` (v4), `@effect/platform-node` for CLI/runtime patterns.
- `effect/unstable/reactivity/Atom` and `AtomRegistry` for interaction state.
- `@urban/build-graph` for snapshot schema/type contract.
- D3 force module for layout.
- Pixi.js for high-performance canvas rendering.
