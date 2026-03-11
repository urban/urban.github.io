---
name: build-graph-vault-route
created: 2026-03-11
updated: 2026-03-11
---

## Overview

Add first-class route-aware note support to `@urban/build-graph` so downstream consumers can build graph snapshots from Markdown corpora whose filesystem filenames differ from their canonical published routes. The design introduces canonical slug and route-path identity derived from validated frontmatter `permalink` plus a configured route prefix, preserves source provenance alongside route identity, expands note-node metadata and indexes for route consumers, and exposes a higher-level public build helper that owns discovery-through-snapshot orchestration.

## Requirements Alignment

- Supports route-aware note identity, prefixed route paths, and kebab-case permalink validation (`FR1.1` through `FR1.6`, `FR1.12`, `TC3.3`, `TC3.4`).
- Supports metadata-rich snapshot output and route-aware indexes for vault-route consumers (`FR1.7` through `FR1.10`, `DR4.2` through `DR4.5`, `IR5.1`, `IR5.3`).
- Supports curated public orchestration for programmatic website integration (`FR1.11`, `IR5.2`, `IR5.4`).
- Preserves determinism, type safety, and schema-versioned migration discipline (`NFR2.1` through `NFR2.4`, `TC3.5`, `SC7.6`).

## Architecture Summary

The feature extends build-graph around a dual-identity note model:

1. Source identity remains the truth for filesystem discovery, source loading, and diagnostics.
2. Canonical route identity becomes the truth for note-node ids, route-aware indexes, and downstream selection contracts.
3. Snapshot output becomes metadata-rich enough for route consumers to render graph labels and route selection directly from the library contract.

The implementation keeps the existing build stages but upgrades their shared data model:

- discovery/loading yields source provenance
- validation decodes route-aware permalink and note metadata
- resolution continues to match wikilinks against canonical note identifiers plus aliases
- snapshot normalization emits richer note nodes and route-aware indexes
- the public API adds a higher-level helper that wires the pipeline together

## System Context

- Package: `packages/build-graph`
- Current source model: Markdown notes with frontmatter `permalink`, `created`, `updated`, optional `aliases`, optional `published`
- Current route consumer: `packages/website` vault-route feature under `docs/specs/vault-route/`
- Current graph consumers: `@urban/graph-visualizer-2`, `@urban/graph-view`
- Existing pipeline: discovery -> validate -> parse wikilinks -> resolve -> build snapshot -> serialize

## Components and Responsibilities

### Route-Aware Validation Model

- Responsibility: Decode raw note frontmatter plus source provenance into a typed validated note model that distinguishes source identity from canonical route identity.
- Inputs: Markdown source text, source-relative path, optional absolute path, route-aware build options.
- Outputs: `ValidatedMarkdownFile`-like records containing source path fields, body, validated metadata, canonical slug, and canonical route path.

### Canonical Route Normalizer

- Responsibility: Normalize route-prefix configuration and build canonical route identity from validated permalink slug segments.
- Inputs: Frontmatter `permalink`, route prefix option such as `/vault`.
- Outputs: Deterministic canonical slug and route path, plus a route-based node id contract.

### Resolver Index Builder

- Responsibility: Extend wikilink resolution indexes so note resolution can work against canonical route identity while preserving current path / filename / alias precedence.
- Inputs: Route-aware validated notes.
- Outputs: Resolver indexes keyed by source path variants, canonical slug variants, canonical route-path variants where appropriate, filename, and alias.

### Snapshot Builder

- Responsibility: Emit metadata-rich note nodes and route-aware lookup indexes while preserving deterministic ordering, placeholder behavior, and diagnostics.
- Inputs: Route-aware validated notes and parsed wikilinks.
- Outputs: Versioned `GraphSnapshot` with route-aware node ids, metadata-rich note nodes, source provenance, and lookup indexes.

### Public Build Facade

- Responsibility: Provide a curated programmatic entry point that discovers Markdown files, loads text, validates notes, parses wikilinks, builds the normalized snapshot, and returns route-aware outputs.
- Inputs: Filesystem root plus build options.
- Outputs: Deterministic route-aware snapshot build result usable from website SSG code or CLI code.

## Data Model and Data Flow

- Entities:
  - `BuildGraphOptions`: route-aware config including optional `routePrefix` and mode flags.
  - `CanonicalRouteIdentity`: `{ slug: string, routePath: string, nodeId: string }`.
  - `SourceProvenance`: `{ sourceRelativePath: string, absolutePath?: string }`.
  - `ValidatedRouteAwareMarkdownFile`: validated note carrying source provenance, frontmatter, body, and canonical route identity.
  - `GraphSnapshotNoteNode`: extended note node carrying canonical route identity, source provenance, and note metadata.
- Flow:
  1. Discovery returns source files with source-relative paths and absolute paths.
  2. Validation parses frontmatter, validates route-aware permalink slug segments, normalizes `published`, and computes canonical route identity from the configured prefix.
  3. Duplicate validation checks canonical route collisions in addition to any retained permalink uniqueness rules.
  4. Wikilink parsing remains body-based.
  5. Resolver indexing stores the source path and canonical identity forms needed for deterministic path, filename, and alias matching.
  6. Snapshot building uses canonical route identity for note node ids and preserves source provenance on nodes and diagnostics.
  7. Snapshot normalization emits metadata-rich nodes plus route-aware indexes such as `noteNodeIdBySlug` and `noteNodeIdByRoutePath`.
  8. Serialization and schema validation enforce the new contract version.

## Interfaces and Contracts

- Route-aware build options:
  - `routePrefix?: string`
  - `identityStrategy?: "source-path" | "canonical-route"`
  - default behavior preserves current source-path identity for legacy callers unless route-aware mode is explicitly enabled
- Raw frontmatter contract:
  - `permalink` remains required
  - in route-aware mode `permalink` must be a kebab-case slug segment without slash separators
  - `created`, `updated`, `aliases`, `published` remain supported
  - `title` and optional `description` are added if build-graph becomes the first-class metadata source for route consumers
- Snapshot note-node contract:
  - preserves `kind: "note"`
  - includes `id`, `slug`, `routePath`, `sourceRelativePath`, `permalink`, `created`, `updated`, `aliases`, `published`
  - includes `title` or `label`
  - includes optional `description` or normalized excerpt when available
- Snapshot indexes contract:
  - retains `nodesById`, `edgesBySourceNodeId`, `edgesByTargetNodeId`
  - adds `noteNodeIdBySlug`
  - adds `noteNodeIdByRoutePath`
- Curated public API additions:
  - programmatic discovery helper export
  - high-level route-aware snapshot builder export
  - option types and tagged errors for invalid permalink slug segments or duplicate canonical routes

## Integration Points

- `src/domain/schema.ts`: extend frontmatter, validated-note, and snapshot schemas; version the snapshot contract.
- `src/core/validate.ts`: compute canonical route identity, validate kebab-case permalink segments, preserve source provenance, detect duplicate canonical routes.
- `src/core/resolve.ts`: add canonical route identity to resolution indexes without regressing precedence.
- `src/core/build.ts`: switch route-aware note node ids to canonical identity and emit metadata-rich note nodes plus source-aware diagnostics.
- `src/core/snapshot.ts`: normalize new note-node shape and route-aware indexes.
- `src/cli/discover.ts`: expose discovery helper through curated API or shared internal helper used by new public facade.
- `src/index.ts`: export the route-aware build facade, discovery helper, and new schema/types.
- `README.md` and migration docs: document route-aware mode, permalink slug rules, prefix configuration, and snapshot migration guidance.

## Failure and Recovery Strategy

- Invalid route-aware `permalink` values fail validation with source-aware diagnostics that identify the real source note path.
- Duplicate canonical slugs or duplicate canonical route paths fail the build before snapshot generation.
- Ambiguous wikilink resolution continues to fail the build, with diagnostics reporting source provenance and candidate source paths.
- Unresolved wikilinks continue to emit placeholder nodes and diagnostics.
- Legacy callers can remain on source-path identity until they opt into canonical-route identity, reducing migration blast radius.

## Security, Reliability, and Performance

- Prefix normalization must be deterministic and free of path-joining ambiguity such as duplicate slashes.
- Preserving source provenance improves operational debugging without requiring consumers to store private path maps outside the library.
- Metadata-rich snapshot nodes increase payload size; this is acceptable because the feature removes duplicate downstream metadata models and extra parsing work.
- The high-level public build facade reduces consumer duplication and narrows the number of unsupported orchestration paths.
- Schema-versioned migration guidance reduces the chance of silent downstream contract drift.

## Implementation Strategy

1. Extend the validated note model and route-aware options without removing current source-path behavior.
2. Add canonical permalink slug validation and route-prefix normalization.
3. Update snapshot note-node and index schemas, then thread the richer data through build and normalization.
4. Add source-provenance preservation to diagnostics and duplicate detection.
5. Export discovery and high-level route-aware build helpers on the curated public API.
6. Update docs and migration notes, then adapt package tests to cover both legacy and route-aware flows.

Key boundary choice: canonical route identity owns graph selection and route lookup in route-aware mode, while source provenance remains the truth for diagnostics and filesystem traceability.

## Testing Strategy

- Unit test route-aware permalink validation for valid kebab-case segments and invalid slash-containing or non-kebab values.
- Unit test canonical route-path derivation with prefixes such as `/vault`, `vault`, and `/vault/` producing the same output.
- Unit test source filename divergence, including `Harness Loop.md` plus `permalink: harness-loop`.
- Unit test duplicate canonical slug and duplicate route-path failures.
- Unit test snapshot note-node shape and route-aware indexes.
- Unit test diagnostic provenance when source path differs from canonical route identity.
- Regression test legacy source-path mode to ensure current consumers still pass.
- Public API tests covering the new discovery and high-level snapshot build helpers.

## Risks and Tradeoffs

- Adding metadata to build-graph expands its responsibility beyond minimal graph structure; this is justified because downstream route consumers already need this data and currently duplicate it.
- Supporting both legacy and route-aware identity strategies increases code-path count; it is still preferable to a hard cutover that would break current consumers immediately.
- Treating `permalink` as a slug segment in route-aware mode is narrower than full arbitrary path support; this is intentional because vault-route needs a stable single-segment slug under one shared prefix.

## Further Notes

- Assumptions: route-aware mode is opt-in for the first release; vault-route remains the primary integration target; note titles can come from frontmatter if the package adopts title metadata.
- Open questions: None.
- Decision: shared route prefix is configuration, not frontmatter data, so notes keep `permalink: harness-loop` rather than `/vault/harness-loop`.
