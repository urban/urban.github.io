---
name: graph-view-v2
created: 2026-03-02
updated: 2026-03-02
---

## Problem Statement

`@urban/graph-view` currently validates/renders from a local snapshot schema that can drift from `@urban/build-graph`. `@urban/build-graph` now defines v2 snapshot contract (`schemaVersion: "2"`, required `indexes`). `graph-view` must hard-align to v2 and refactor internals to Effect v4 patterns.

## Goals

- hard-cut `graph-view` input to build-graph v2 snapshot only.
- import snapshot schema/type from `@urban/build-graph`; no local mirror.
- keep CLI UX unchanged: `graph-view <from> <to>`.
- refactor internals to Effect-native decode/model/render flow with tagged errors.
- move CLI runtime boundary to `@effect/platform-bun`.
- render Mermaid via Effect Graph native Mermaid support (`Graph.toMermaid`) with minimal custom logic.
- preserve deterministic output.

## Non-Goals

- no v1 compatibility path.
- no UI/interactive graph viewer.
- no requirement for byte-identical Mermaid parity with v1 graph-view output.
- no custom Mermaid line-by-line renderer unless Effect Graph cannot express required behavior.

## Success Criteria

- decode accepts only v2 snapshots validated by imported `GraphSnapshotSchema`.
- non-v2 input fails at decode boundary.
- CLI command/args unchanged for users.
- renderer uses `Graph.toMermaid` and outputs deterministic Mermaid/Markdown.
- placeholder nodes remain visually distinct (shape-based).
- edges are unlabeled.
- edge references to missing node ids fail fast.
- public API is curated/minimal; no duplicated schema re-export surface.

## Approach

Implement Effect-native staged refactor:

1. Contract alignment first.

- remove local snapshot schema/types from `graph-view`.
- import `GraphSnapshotSchema` + `GraphSnapshot` from `@urban/build-graph`.

2. Effect-native internals.

- keep parse/decode at boundary with tagged errors.
- model render inputs as constrained ADT.
- build graph with `Effect/Graph` and render Mermaid via `Graph.toMermaid`.

3. API/CLI cleanup.

- keep CLI UX stable.
- move runtime/fs boundary to Bun platform.
- trim exports to minimal stable set.

## Architecture and Components

- `src/core/decode.ts` (public)
  - accepts `string | GraphSnapshot`.
  - parses JSON when needed.
  - validates using imported `GraphSnapshotSchema`.
  - emits tagged parse/validation errors.

- `src/core/model.ts` (internal)
  - converts validated snapshot to renderer ADT:
    - note node
    - placeholder node
    - edge
  - enforces deterministic ordering before graph construction.
  - asserts edge endpoint existence; missing endpoint => hard failure.

- `src/core/render-mermaid.ts` (public)
  - builds `Graph.directed` from model.
  - calls `Graph.toMermaid` with:
    - `direction: "LR"`
    - `diagramType: "graph"`
    - `edgeLabel: () => ""` (unlabeled edges)
    - `nodeLabel` mapping note/placeholder labels
    - `nodeShape` mapping kind-based shape distinction

- `src/core/render-markdown.ts` (public)
  - wraps Mermaid into:
    - `## Graph`
    - fenced `mermaid` block

- `src/cli/main.ts`
  - only filesystem boundary.
  - reads `<from>`, decodes, renders, ensures output parent dir, writes `<to>`.
  - implemented on `@effect/platform-bun` runtime/services.

- `src/index.ts`
  - curated exports only (decode/render/cli + tagged errors).
  - does not re-export build-graph snapshot schemas/types.

## Data Flow

1. CLI parses `from` and `to` args.
2. CLI reads snapshot text from `from`.
3. `decodeGraphSnapshot` parses + validates via imported v2 schema.
4. model layer normalizes to deterministic ADT and validates edge-node referential integrity.
5. renderer builds Effect Graph from model.
6. `Graph.toMermaid` emits Mermaid text (`graph LR`, unlabeled edges, shape-based placeholder distinction).
7. markdown renderer wraps Mermaid.
8. CLI writes markdown to `to`.

## Error Handling

Hard failures:

- invalid CLI path state (`from` missing/non-file, invalid output path state).
- read/write IO failures.
- JSON parse failure.
- schema validation failure (includes non-v2 snapshots and missing required indexes).
- edge references missing node id.

Non-hard behavior:

- unresolved links represented by placeholder nodes render normally as placeholder-shaped nodes.

Error model:

- tagged errors only.
- separate decode errors from CLI fs errors.

## Testing Expectations

- decode tests:
  - valid v2 object input.
  - valid v2 JSON input.
  - invalid JSON failure.
  - non-v2/missing `schemaVersion` failure.
  - missing required index keys failure.

- render-mermaid tests:
  - uses LR direction output.
  - edges unlabeled.
  - placeholder shape differs from note shape.
  - deterministic output under reordered input.
  - fails fast on missing edge endpoint node.

- render-markdown tests:
  - exact markdown wrapper contract.

- CLI integration tests:
  - successful read/decode/render/write path.
  - creates missing output parent directories.
  - expected failures for invalid args/path/read/write/decode.

- public API tests:
  - curated stable top-level exports only.
  - no duplicated snapshot contract exports.

## Constraints and Assumptions

- package manager is Bun.
- base branch is `main`.
- Effect v4 patterns preferred over custom implementations.
- strict type safety rules apply:
  - no `any`
  - no non-null assertions
  - no type assertions
- parse/validate at boundaries before core logic.

## Rollout / Migration Notes

- hard cutover to v2-only input in `graph-view`.
- no compatibility adapter for v1 snapshot.
- update README examples/CLI docs to require build-graph v2 snapshot shape.
- note output may change while still deterministic and semantically equivalent.

## Risks and Mitigations

- risk: downstream users still pass v1 snapshots.
  mitigation: explicit decode failure + clear migration docs/examples.

- risk: `Graph.toMermaid` output formatting differs from prior handcrafted output.
  mitigation: deterministic snapshot->mermaid tests, documented expected diff.

- risk: hidden referential inconsistencies in external snapshots.
  mitigation: explicit invariant check and fail-fast behavior.

## Dependencies

- `effect` v4 (`Graph.toMermaid`, schema/effect primitives).
- `@effect/platform-bun` for CLI runtime/fs boundary.
- `@urban/build-graph` as snapshot contract source-of-truth.

## Open Questions (`TODO: Confirm`)

- None.
