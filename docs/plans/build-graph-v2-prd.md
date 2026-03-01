---
name: build-graph-v2
created: 2026-03-01
updated: 2026-03-01
---

## Problem Statement

Teams using `@urban/build-graph` need same CLI UX but internals more Effect-native and safer to evolve. Current internals mix custom patterns with Effect patterns, and snapshot output is not versioned for deliberate breaking change management.

## Goals

- Keep CLI command/args/core flow unchanged for users.
- Refactor internals to Effect-native modules/patterns end-to-end.
- Prefer Effect modules by default; custom code needs explicit rationale.
- Standardize pipeline on typed effects, tagged errors, and schema-boundary parsing.
- Ship versioned snapshot v2 with explicit `schemaVersion`.
- Allow output contract evolution while preserving v1 information surface (no data loss).
- Require required v2 indexes for faster/deterministic consumer lookup.
- Reduce public API to minimal stable stage APIs + selected helpers.
- Provide migration guide with mapping, checklist, and before/after examples.

## Non-Goals

- Changing CLI UX or invocation semantics.
- Keeping byte-identical payload parity with v1.
- Adding filesystem operations to library modules.
- Shipping dual-write v1/v2 compatibility artifacts.

## Success Criteria

- Existing CLI usage still works with no arg/flow change.
- Output snapshot includes `schemaVersion` and validates as v2 contract.
- V2 snapshot exposes same or more semantic info than v1.
- Required v2 indexes always present and deterministic.
- Ambiguous resolution remains hard failure; unresolved links remain diagnostics.
- Public API surface reduced and documented as stable stage API.
- Migration guide exists and is sufficient for downstream consumer upgrades.

## Solution

Deliver a contract-first v2 cutover, then complete internal refactor against that contract. Users run same CLI and get v2 snapshot output with explicit versioning, deterministic views, and richer index access. Internals shift to Effect-native patterns for validation, resolution, graph assembly, and serialization. Side effects remain in CLI boundary only.

## User Stories

1. As a CLI user, I want same command and args, so that upgrade cost is near zero.
2. As a docs maintainer, I want v2 snapshots to declare schema version, so that consumers can branch behavior safely.
3. As an integration engineer, I want required indexes in snapshot, so that common lookups are fast and consistent.
4. As an integration engineer, I want array views still present, so that simple deterministic iteration remains easy.
5. As a library consumer, I want typed/tagged failures, so that error handling is explicit and composable.
6. As a content maintainer, I want ambiguous links to fail hard with candidate context, so that wrong edges never ship silently.
7. As a content maintainer, I want unresolved links retained as diagnostics, so that known gaps stay visible without dropping intent.
8. As a platform engineer, I want deterministic ordering and serialization, so that unchanged inputs produce stable diffs.
9. As a platform engineer, I want library code free of filesystem concerns, so that APIs stay pure and easier to test.
10. As an API consumer, I want a minimal curated public surface, so that long-term integration risk is lower.
11. As a migration owner, I want clear v1->v2 mapping docs, so that consumers can upgrade without reverse-engineering.
12. As a reviewer, I want custom non-Effect logic explicitly justified, so that architecture drift is controlled.

## Implementation Decisions

- Use v2 snapshot contract as primary design anchor before internals refactor.
- Perform hard cutover: default output artifact becomes v2 directly.
- Make top-level `indexes` required.
- Require index keys `nodesById`, `edgesBySourceNodeId`, and `edgesByTargetNodeId`.
- Keep array views (`nodes`, `edges`, `diagnostics`) in v2 for deterministic/simple consumption.
- Use semantic `NodeId` as external identity; numeric graph indices remain internal-only debug metadata.
- Keep pipeline staged: validate inputs, build resolver index, parse links, resolve targets, build graph, normalize/serialize snapshot.
- Push normalization/defaulting to schema transforms at boundaries.
- Keep ambiguity a hard failure; keep unresolved targets as non-hard diagnostics.
- Enforce typed effects and tagged errors across pipeline.
- Restrict filesystem read/write to CLI layer; library remains in-memory/pure.
- Curate exports to minimal stage API and selected helpers only.

## Dependencies

- Effect v4 modules (runtime, schema, graph, collections/combinators).
- Effect Bun platform runtime for CLI boundary integration.
- Bun workspace tooling for build/test/publish workflows.
- Downstream consumers of `graph-snapshot.json` that must migrate to v2 contract.

## Testing Decisions

- Contract tests for v2 schema validity, required indexes, and `schemaVersion`.
- Semantic parity tests asserting v2 preserves v1 information surface.
- Resolution tests for precedence, ambiguity hard-fail behavior, and unresolved diagnostics behavior.
- Determinism tests for stable ordering and byte-stable serialization.
- Boundary tests proving library APIs stay filesystem-agnostic.
- API surface tests ensuring only curated exports remain public.
- Migration guide example tests ensuring documented before/after mappings are correct.
- Regression tests for typed error taxonomy and aggregation semantics.

## Further Notes

- Derived from `docs/plans/build-graph-v2-design.md`.
- TODO: Confirm final v2 field-level diff table for migration doc.
- TODO: Confirm exact consumer validation window/timeline for hard cutover.
- TODO: Confirm whether internal debug metadata for graph indices should be emitted at all in v2.
- GitHub issue: https://github.com/urban/urban.github.io/issues/34
