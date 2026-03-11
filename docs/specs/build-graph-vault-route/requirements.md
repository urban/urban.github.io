---
name: build-graph-vault-route
created: 2026-03-11
updated: 2026-03-11
---

## Problem Statement

`@urban/build-graph` currently models note identity around source `relativePath`, sparse note-node output, and low-level orchestration APIs. That contract forces the `vault-route` feature to project notes onto synthetic `${slug}.md` paths, duplicate route-prefix logic, derive slug-to-node mappings outside the library, and maintain a second website-local content model for graph labels and metadata. The library needs first-class route-aware support for notes whose filesystem filenames may contain spaces while their canonical published identity is a kebab-case permalink segment under a shared route prefix such as `/vault`.

## Goals

- Add first-class route identity to `@urban/build-graph` for vault-style note corpora.
- Support notes whose filesystem names differ from their canonical route slug, including names with spaces and casing differences.
- Allow consumers to configure a route prefix such as `/vault` while keeping note frontmatter permalink values prefix-free slug segments such as `harness-loop`.
- Expand snapshot note-node output and indexes so route consumers can render labels, metadata, and selection state directly from the library contract.
- Expose a higher-level public API that supports route-aware discovery and snapshot generation without CLI shelling or duplicated orchestration logic.

## Non-Goals

- Replacing filesystem-based wikilink parsing with a non-Markdown source model.
- Introducing website-specific rendering concerns such as HTML excerpts or MDX compilation into the library.
- Adding graph-driven client-side route navigation behavior.
- Removing existing path-, filename-, or alias-based wikilink resolution modes for non-vault consumers.
- Requiring every existing consumer to migrate to route-aware configuration in the same release.

## Personas / Actors

- Website integrator consuming `@urban/build-graph` during static generation.
- Site maintainer authoring Markdown notes with human-readable filenames and route-safe permalinks.
- Graph UI consumer rendering labels, metadata, and selection state from snapshot output.
- Library maintainer preserving deterministic behavior and backward-compatible migration paths.

## Functional Requirements

- FR1.1: `@urban/build-graph` shall allow each note input to preserve source file identity separately from canonical route identity.
- FR1.2: `@urban/build-graph` shall treat note frontmatter `permalink` as the canonical route slug segment for vault-route-style builds, with values such as `harness-loop` remaining independent of source filenames such as `Harness Loop.md`.
- FR1.3: `@urban/build-graph` shall support a configured permalink prefix for route-aware builds, so a slug segment `harness-loop` can produce a canonical route path `/vault/harness-loop`.
- FR1.4: `@urban/build-graph` shall validate that route-aware `permalink` values are non-empty kebab-case slug segments and fail the build when a note uses an invalid segment.
- FR1.5: `@urban/build-graph` shall continue to validate and normalize note frontmatter fields `created`, `updated`, `aliases`, and `published`.
- FR1.6: `@urban/build-graph` shall emit canonical route identity on note nodes, including at minimum a slug field and a route-path field derived from the configured prefix plus the validated permalink segment.
- FR1.7: `@urban/build-graph` shall emit note display metadata on snapshot note nodes, including title or label, created, updated, aliases, published, and description-compatible summary data when available.
- FR1.8: `@urban/build-graph` shall preserve publication state on snapshot note nodes so downstream consumers can distinguish unpublished notes from absent notes.
- FR1.9: `@urban/build-graph` shall expose route-aware lookup indexes, including note lookup by slug and by route path.
- FR1.10: `@urban/build-graph` shall preserve source provenance in validated note records, snapshot note nodes, and diagnostics so failures can still identify the real filesystem source after route normalization.
- FR1.11: `@urban/build-graph` shall provide a curated public helper that discovers Markdown files, loads source text, validates notes, parses wikilinks, and returns a normalized route-aware `GraphSnapshot`.
- FR1.12: `@urban/build-graph` shall support route-aware graph selection by making the canonical note node id deterministic from canonical route identity rather than raw source `relativePath`.

## Non-Functional Requirements

- NFR2.1: Route-aware graph output shall remain deterministic for unchanged source input and unchanged build configuration.
- NFR2.2: Existing non-route-aware consumers shall retain a supported migration path, with current behavior preserved by default or through an explicit legacy mode.
- NFR2.3: Snapshot contract changes shall remain schema-validated and versioned.
- NFR2.4: Route-aware APIs shall remain fully type-safe and shall not require `any`, non-null assertions, or unsafe type assertions in library implementation.
- NFR2.5: Added route-aware metadata and indexes shall not require downstream consumers to parse Markdown source again for common graph UI needs.

## Technical Constraints

- TC3.1: The implementation shall remain within the `@urban/build-graph` package and its curated public API surface.
- TC3.2: The implementation shall continue to support current wikilink resolution precedence of path, filename, then alias.
- TC3.3: Route prefix configuration shall normalize leading and trailing slashes consistently so equivalent prefixes produce identical output.
- TC3.4: Kebab-case permalink validation shall reject slash-delimited route paths in route-aware mode; the shared prefix is supplied by configuration, not duplicated in frontmatter.
- TC3.5: Snapshot schema evolution shall include an explicit schema-version update and migration notes for downstream consumers.

## Data Requirements

- DR4.1: Route-aware note input shall carry both source-relative path data and canonical route identity data.
- DR4.2: Snapshot note nodes shall include canonical slug, canonical route path, source-relative path, and source absolute path or equivalent provenance identifier.
- DR4.3: Snapshot note nodes shall include metadata fields required by vault-route consumers: title or label, created, updated, aliases, published, permalink slug, and optional description or excerpt.
- DR4.4: Snapshot indexes shall include `nodesById`, `edgesBySourceNodeId`, `edgesByTargetNodeId`, `noteNodeIdBySlug`, and `noteNodeIdByRoutePath`.
- DR4.5: Diagnostics for invalid frontmatter, duplicate canonical routes, ambiguous resolution, and unresolved wikilinks shall report source provenance using real source-relative paths even when canonical route identity differs.

## Integration Requirements

- IR5.1: Route-aware build output shall satisfy the needs documented in `docs/specs/vault-route/requirements.md` and `docs/specs/vault-route/technical-design.md`.
- IR5.2: The curated public API shall support programmatic use from `packages/website` without shelling out to the CLI.
- IR5.3: Snapshot note-node metadata shall be consumable by `@urban/graph-visualizer-2` and other graph UIs without requiring a parallel label-derivation model.
- IR5.4: CLI behavior shall either expose the new route-aware options directly or clearly delegate to the same route-aware build contract used by the library API.

## Dependencies

- DEP6.1: Existing `@urban/build-graph` validation, parsing, resolution, and snapshot normalization flows.
- DEP6.2: Downstream vault-route requirements under `docs/specs/vault-route/`.
- DEP6.3: Existing graph consumers including `@urban/graph-visualizer-2` and `@urban/graph-view`.
- DEP6.4: Markdown note corpora that use frontmatter `permalink`, `created`, `updated`, optional `aliases`, and optional `published`.

## Success Criteria

- SC7.1: A route-aware build can ingest notes such as `Harness Loop.md` with frontmatter `permalink: harness-loop` and produce a canonical route path `/vault/harness-loop`.
- SC7.2: Route-aware snapshot note ids and lookup indexes let a consumer select a node directly from slug `harness-loop` or route path `/vault/harness-loop` without projecting synthetic filenames outside the library.
- SC7.3: Snapshot note nodes include sufficient metadata for vault-route labels and selection UI without a second website-local graph metadata model.
- SC7.4: Diagnostics and validation errors for route-aware builds still identify the real source note path when canonical route identity differs from the source filename.
- SC7.5: A curated library helper can build a normalized route-aware snapshot from a filesystem root without consumers reimplementing discovery and orchestration.
- SC7.6: Existing supported consumers can migrate to the new snapshot contract with explicit schema/version guidance.

## Further Notes

- Assumptions: vault-route is the primary first-class route-aware consumer; `permalink` remains one field on each note; prefix configuration is corpus-wide for a given build invocation.
- Open questions: None.
- Deferred intentionally: generalized multi-prefix or per-note prefix selection is out of scope for the first slice.
