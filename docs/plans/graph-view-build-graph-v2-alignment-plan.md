---
name: graph-view-build-graph-v2-alignment-plan
created: 2026-03-11
updated: 2026-03-11
---

## Execution Summary

Update `@urban/graph-view` to consume the current `@urban/build-graph` snapshot contract, preserve CLI/library validation against `schemaVersion: "2"` plus required indexes, and surface richer note identity in rendered output so canonical-route snapshots remain readable without filename projection.

## Scope Alignment

- User Stories: `docs/specs/build-graph-vault-route/user-stories.md`
- Requirements: `docs/specs/build-graph-vault-route/requirements.md`
- Technical Design: `docs/specs/build-graph-vault-route/technical-design.md`
- In-scope implementation objective: align `@urban/graph-view` with the shipped build-graph v2 snapshot contract and route-aware note metadata (`schemaVersion`, `indexes`, `sourceRelativePath`, `slug`, `routePath`, `label`, dates, aliases, published, title, description) while keeping markdown/mermaid rendering deterministic.

## Implementation Streams

### Snapshot Contract Intake

- Objective: accept the current build-graph snapshot shape at the graph-view decode boundary without weakening validation.
- Implements:
  - `FR1.6`
  - `FR1.7`
  - `FR1.8`
  - `FR1.9`
  - `DR4.2`
  - `DR4.3`
- Notes: current graph-view schema still models the pre-v2 root shape and minimal note nodes, so decode fails on valid build-graph output.

### Route-Aware Rendering

- Objective: render note nodes from first-class note metadata instead of assuming source-relative filenames are the only meaningful label.
- Implements:
  - `FR1.1`
  - `FR1.6`
  - `FR1.10`
  - `NFR2.1`
  - `SC7.6`
- Notes: canonical-route snapshots can use route paths as node ids; renderer behavior must stay deterministic and readable for both source-path and canonical-route identity modes, with rendered note labels preferring `title` before `label`.

### Consumer Compatibility and Docs

- Objective: lock the new contract into tests, public API, CLI fixtures, and README migration guidance so graph-view tracks build-graph intentionally.
- Implements:
  - `NFR2.2`
  - `NFR2.4`
  - `NFR2.5`
  - `IR5.4`
- Notes: graph-view owns the read boundary, so docs/tests must make the v2 dependency explicit rather than relying on implied compatibility.

## Work Breakdown

### Snapshot Contract Intake

- [x] Extend graph-view schemas and decode tests to require `schemaVersion: "2"` and `indexes`, while accepting the richer v2 note-node payload.
- [x] Export any newly required schema types from the top-level public API without regressing current CLI/decode entry points.
- [x] Add regression coverage proving graph-view accepts snapshots emitted by current build-graph fixtures, including slug/route-path indexes.

### Route-Aware Rendering

- [x] Define deterministic node label selection for note nodes using the new metadata surface, preferring `title`, then `label`, with source-path fallback for legacy snapshots where optional fields are absent.
- [x] Update Mermaid and Markdown renderer expectations for canonical-route node ids, route-aware labels, and unresolved placeholders.
- [x] Add tests covering both source-path and canonical-route builds so rendering remains stable across identity strategies.

### Consumer Compatibility and Docs

- [x] Update CLI tests and README examples to show the v2 snapshot root shape and route-aware note metadata.
- [x] Document migration notes for consumers who assumed graph-view only accepted the pre-v2 root or always rendered `relativePath`.
- [x] Verify top-level API tests, package docs, and example snapshot JSON stay aligned with build-graph README guarantees.

## Dependency and Sequencing Strategy

- Prerequisites: current `@urban/build-graph` v2 snapshot contract, existing `@urban/graph-view` CLI/decode/render pipeline, and the upstream `build-graph-vault-route` spec pack.
- Sequencing notes: first fix the schema/read boundary so valid snapshots decode, then settle rendering semantics for richer note metadata, then finish with docs and regression coverage that freeze the aligned behavior.
- Coordination risks: title-first rendering can surface verbose editorial metadata in dense graphs if not covered by fixtures; lock precedence and expected output with snapshot-based tests before updating docs/examples.

## Validation Checkpoints

- `bash .agents/skills/execution-planning/scripts/validate_plan.sh docs/plans/graph-view-build-graph-v2-alignment-plan.md`
- `bun --filter @urban/graph-view test`
- `bun --filter @urban/graph-view typecheck`
- `bun --filter @urban/graph-view lint`
- `bun run lint`
- `bun run test`
- `bun run typecheck`
- Targeted verification for decode acceptance of build-graph v2 snapshots and deterministic rendering across source-path plus canonical-route identity modes.

## Risks and Mitigations

- Risk: title-first rendering makes some graphs noisier or less scannable than slug-like labels.
- Mitigation: lock `title -> label -> fallback` precedence in tests and docs so any later tuning is an explicit contract change.
- Risk: partial schema updates accept v2 superficially but ignore required indexes or exported types.
- Mitigation: validate full root schema, add decode fixtures with indexes populated, and update public API surface tests.
- Risk: docs/examples lag the code and keep advertising the obsolete snapshot shape.
- Mitigation: treat README, CLI fixtures, and public API tests as part of the same delivery stream and update them in one pass.

## Progress Tracking

- Status: Completed
- Active stream: None
- Notes: Implemented v2 root validation, route-aware note label rendering, public API/schema export coverage, CLI/render regression fixtures, and README migration guidance. Full repo gates passed on 2026-03-11.

## Further Notes

Observed repo evidence driving this plan:

- `packages/build-graph/src/domain/schema.ts` requires `schemaVersion: "2"` and `indexes`, plus richer optional note metadata.
- `packages/graph-view/src/domain/schema.ts` still models the older three-array root and minimal note nodes.
- `packages/graph-view/src/core/render-mermaid.ts` currently labels note nodes with `relativePath` only, which misses the approved `title`-first then `label` rendering intent for route-aware metadata.
- `packages/build-graph/README.md` includes an explicit v1 to v2 migration guide; graph-view docs do not yet mirror that contract shift.
