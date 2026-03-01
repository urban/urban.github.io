---
name: build-graph-v2
created: 2026-03-01
updated: 2026-03-01
---

## Problem Statement

`@urban/build-graph` works, but internals still partly custom and not consistently Effect-native. We need conservative refactor: keep CLI UX same, move internals to Effect v4 patterns/modules, ship versioned snapshot v2 with hard cutover.

## Goals

- make internals feel Effect-native end-to-end.
- favor Effect modules over custom code by default.
- if custom code used, require explicit justification in code/docs.
- standardize pipeline on typed effects + tagged errors.
- simplify collection/index/sort logic via Effect collections/combinators.
- push more normalization/defaulting into Schema transforms.
- add `schemaVersion` and versioned snapshot v2 contract.
- allow output shape evolution, but no data loss vs v1.
- ensure consumers can access same or more info than v1.

## Non-Goals

- no CLI UX changes (command, args, core flow).
- no filesystem in library code.
- no requirement for byte-identical parity with v1 output.

## Success Criteria

- CLI UX unchanged for users.
- library stays filesystem-agnostic; CLI owns all fs reads/writes.
- v2 snapshot has clear versioning (`schemaVersion`) and documented break.
- migration guide exists (narrative mapping + consumer checklist + examples).
- public API reduced to minimal useful stage API + selected helpers.
- design defines strict engineering guardrails for type safety + ADT modeling.

## Approach

Use contract-first v2, then phased internals:

- phase 1 defines v2 snapshot contract first.
- phase 2 refactors internals to Effect-native modules/patterns against v2 contract.
- phase 3 finalizes minimal public API/exports.

Snapshot shape strategy is **hybrid**:

- keep array views (`nodes`, `edges`, `diagnostics`) for deterministic/simple consumption.
- add indexed sections for faster lookup/richer metadata.
- make top-level `indexes` required in v2.
- require exactly 3 v2 index views:
  - `nodesById`
  - `edgesBySourceNodeId`
  - `edgesByTargetNodeId`
- external identity is **NodeId-first** (semantic IDs).
- Graph numeric indices stay internal; optional debug metadata only, non-contract.

## Architecture and Components

- `domain/schema.ts`
  v2 schemas/types, tagged diagnostics/errors, schema transforms/defaults.
- `core/validate.ts` (public)
  pure note validation API on in-memory inputs.
- `core/parse.ts` (public helper)
  pure wikilink parsing.
- `core/resolve.ts` (public)
  resolver index + target resolution, deterministic precedence.
- `core/build.ts` (public)
  Graph assembly via `Effect/Graph`.
- `core/snapshot.ts` (public helper)
  normalize + serialize v2 snapshot.
- `cli/main.ts`
  only fs boundary; reads files, calls library stages, writes outputs/backups.
- `index.ts`
  curated exports only.

## Data Flow

1. CLI discovers/reads markdown files.
2. CLI passes in-memory raw notes to library.
3. `validateNotes` parses/validates/normalizes note data.
4. `buildResolverIndex` builds deterministic lookup indices.
5. `parseWikilinks` extracts links from note bodies.
6. `buildGraphSnapshot` resolves links, builds graph, emits v2 snapshot + diagnostics.
7. `normalizeGraphSnapshot` + `serializeGraphSnapshot` produce deterministic output text.
8. CLI writes v2 `graph-snapshot.json` and backup policy as today.

## Error Handling

- typed/tagged errors only.
- ambiguity remains hard failure.
- unresolved links remain diagnostics (non-hard) with retained link intent.
- validation failures aggregated and reported semantically.

## Testing Expectations

- semantic tests for validation, resolution precedence, ambiguity, unresolved behavior.
- tests for no-data-loss guarantee vs v1 info surface.
- tests for v2 schema versioning + migration doc examples.
- tests that library has no fs dependency (CLI only).
- tests for deterministic ordering/serialization of v2 payload.
- tests that public API surface is minimal and stable by design.

## Constraints and Assumptions

- package manager is Bun.
- base branch is `main`.
- Effect-native strong preference policy:
  default to Effect modules; custom logic needs explicit rationale.
- strict type safety policy:
  no `any`, no non-null assertion `!`, no type assertions `as Type`.
- model illegal states out via ADTs/discriminated unions.
- parse/validate at boundaries before core logic.

## Rollout / Migration Notes

Three phases:

1. Contract v2

- define snapshot v2 schemas + `schemaVersion`.
- define breaking changes and narrative migration guide.

2. Effect-native internals

- refactor pipeline/collections/schema transforms to Effect-native style.

3. API/export cleanup

- enforce curated exports and remove non-essential public surface.

Hard cutover policy:

- `graph-snapshot.json` becomes v2 directly.
- no dual-write compatibility artifact planned.

Migration guide (required, narrative):

- describe how v1 fields map to v2 fields.
- list consumer action checklist.
- include concrete before/after examples.

## Risks and Mitigations

- risk: v2 break impacts consumers.
  mitigation: required migration guide + examples + consumer checklist.
- risk: refactor drifts from Effect-native goal.
  mitigation: explicit guardrail + review gate for custom logic justification.
- risk: hidden info loss in new contract.
  mitigation: no-data-loss acceptance tests against v1 information surface.

## Dependencies

- `effect` v4 modules.
- `@effect/platform-bun` for CLI runtime/fs boundary.

## Engineering Guardrails

- minimal, surgical changes per phase.
- no compromise on type safety rules.
- ADT-first domain modeling.
- abstractions constrained, pragmatic, documented.
- tests assert behavior semantics, not incidental implementation.

## Confirmed v2 Index Contract

- `indexes` is required.
- required `indexes` fields:
  - `nodesById`
  - `edgesBySourceNodeId`
  - `edgesByTargetNodeId`
- no extra domain indexes required in v2 (`diagnosticsByType`, `edgesByResolutionStrategy`, etc. excluded for now).
