---
name: graph-visualizer
created: 2026-03-02
updated: 2026-03-02
---

## Problem Statement

Teams with `@urban/build-graph` snapshots need standalone interactive graph artifact for offline use. Current stack lacks package that turns snapshot into one-file HTML graph with reliable hover-neighborhood focus behavior.

## Goals

- add new `graph-visualizer` package.
- accept `@urban/build-graph` snapshot schema as input contract.
- output one standalone offline HTML file.
- render force-directed graph with D3 layout + Pixi canvas.
- show note labels from `relativePath` filename stem.
- include placeholder nodes with distinct styling.
- hover highlights hovered node + direct neighbors/edges only, mute rest.
- use Effect v4 heavily, including CLI + tagged errors.
- use Atom + AtomRegistry for pointer/hover/highlight state.
- ship both library API and CLI in v1.

## Non-Goals

- no excerpt-level nodes in v1.
- no network/CDN runtime deps.
- no multi-canvas or DOM-overlay labels in v1.
- no watch mode or live incremental ingest in v1.
- no replacement of existing `graph-view` package in this scope.

## Success Criteria

- `graph-visualizer <from> <to>` writes valid standalone HTML.
- output opens and runs fully offline.
- default view shows neutral style for all nodes/edges.
- hover state highlights exactly hovered node + 1-hop neighborhood.
- note label derivation from filename stem works.
- placeholder nodes render distinct and participate in hover logic.
- invalid input/path/decode/integrity failures return clear tagged errors.
- unchanged semantic input yields deterministic HTML bytes.

## Solution

Use hybrid architecture: Effect for boundary decode/model/CLI/error orchestration, D3 for simulation, Pixi for render loop, Atom graph for reactive pointer-to-hover derivations. Bundle runtime + payload into generated HTML so artifact runs with zero network.

## User Stories

1. As a docs maintainer, I want one command that converts snapshot to HTML, so that graph artifacts are easy to publish.
2. As an engineer in restricted env, I want output to run fully offline, so that no network access is needed at runtime.
3. As a reviewer, I want hover to isolate node neighborhood, so that local structure is readable in dense graphs.
4. As a reviewer, I want non-neighborhood nodes muted on hover, so that visual noise drops fast.
5. As a reviewer, I want note labels from filenames, so that nodes are understandable at glance.
6. As a reviewer, I want placeholders visually distinct, so that unresolved or synthetic entities are obvious.
7. As a CLI user, I want clear failures for bad paths or malformed JSON, so that fixing inputs is fast.
8. As an integrator, I want schema-validated decode at boundary, so that contract drift fails early.
9. As a reliability owner, I want missing edge endpoints to fail hard, so that invalid graphs never render as if valid.
10. As a maintainer, I want deterministic output for same input, so that diffs are stable and reviewable.
11. As a package consumer, I want small curated library API plus CLI, so that adoption is low-friction.
12. As a future contributor, I want Effect-native patterns used consistently, so that extending behavior stays coherent.

## Implementation Decisions

- input contract owned by `@urban/build-graph` snapshot schema; no local forked contract.
- decode boundary accepts JSON text or object and returns validated typed snapshot.
- model layer enforces referential integrity; invalid edge endpoints are hard failures.
- render model includes note + placeholder node kinds; label derivation from note path stem only.
- runtime uses single-canvas Pixi draw pipeline with D3 force position updates.
- interaction state modeled via Atom writable/derived graph for pointer, hovered node, highlight set, muted set.
- hover semantics fixed to 1-hop neighborhood in v1; no multi-hop expansion.
- HTML renderer emits fully self-contained document with embedded payload + bundled runtime.
- CLI owns filesystem side effects; core library stays in-memory and pure where possible.
- error taxonomy remains tagged and explicit across parse, validation, model, and IO boundaries.

## Dependencies

- `effect` v4 core + platform runtime for CLI boundary.
- `effect/unstable/reactivity/Atom` + `AtomRegistry`.
- `@urban/build-graph` snapshot schema/type contract.
- D3 force module.
- Pixi.js canvas rendering.

## Testing Decisions

- decode tests for valid object/string input plus invalid JSON/schema cases.
- model tests for label derivation, placeholder inclusion, deterministic normalization, and endpoint integrity failures.
- renderer tests for exactly one canvas, embedded payload/runtime, and deterministic output on unchanged input.
- in-browser runtime tests via `playwriter` against generated local HTML (`file://`) in user Chrome, not jsdom-only simulation.
- playwriter flow follows observe -> act -> observe loop (`snapshot`, hover action, `snapshot`) with URL checks after each action.
- playwriter assertions cover default neutral state, hover neighborhood highlight, non-neighborhood muting, and hover-exit reset.
- playwriter checks include offline guarantee (no network requests after load) and one-canvas invariant at runtime.
- CLI integration tests for happy path, parent-dir creation, and expected tagged failures across args/IO/decode/model errors.

## Further Notes

- derived from `docs/plans/graph-visualizer-design.md`.
- v1 artifact-size decision: `<= 15 MiB` preferred, `> 25 MiB` rejected with tagged CLI failure.
- v1 browser matrix decision: desktop Chrome/Chromium `122+` (macOS/Linux/Windows) is required support for offline `file://` runtime; Firefox/Safari/Edge are best-effort only in v1.
- GitHub issue: https://github.com/urban/urban.github.io/issues/56
