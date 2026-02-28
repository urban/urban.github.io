---
name: build-graph
created: 2026-02-26
updated: 2026-02-26
---

## Problem Statement

Create a reusable TypeScript library that builds a graph from a Markdown knowledge base, plus a CLI that generates a portable `graph-snapshot.json` from a source directory. The graph must use Effect v4 Graph, validate note frontmatter, parse Obsidian-style wikilinks, resolve links by filename/path and aliases, and represent unresolved links as placeholder nodes.

## Goals

- Add a new workspace package at `packages/build-graph`.
- Use Effect v4 Graph as the canonical in-memory model.
- Recursively discover Markdown notes under a required `from` directory.
- Enforce schema-first frontmatter validation before graph assembly.
- Parse wikilinks for `[[target]]` and `[[target|display]]`.
- Resolve links case-insensitively by path, filename, and alias.
- Fail hard on ambiguous link resolution with candidate detail.
- Represent unresolved links as placeholder nodes and retain diagnostics.
- Provide a CLI built with `effect/unstable/cli` and required `from` and `to` arguments.
- Generate deterministic snapshots and persist to `to/graph-snapshot.json`.
- Back up an existing snapshot before overwrite.

## Non-Goals

- UI or visualization features.
- Incremental watch mode.
- Non-Markdown node formats.
- Full Obsidian semantics beyond selected wikilink syntax.
- External network APIs.

## Success Criteria

- CLI succeeds with valid input and writes `to/graph-snapshot.json`.
- Snapshot includes all valid notes as nodes and includes placeholder nodes for unresolved targets.
- Frontmatter/schema issues are fully reported and fail build before assembly.
- Ambiguous link matches fail build with candidate details.
- Repeated runs with unchanged input produce byte-stable snapshot output.

## Approach

Implement a two-phase pipeline with strict schema-first domain contracts and deterministic serialization:

- Phase 1: discover + parse + validate + index.
- Phase 2: parse links + resolve + assemble graph + serialize.

Domain contracts are defined with Effect `Schema` first, and graph assembly only proceeds after all frontmatter validation and duplicate permalink checks pass. Runtime composition and error handling follow Effect v4 best practices (typed errors, `Effect.gen`, and Layers/services only where they clarify boundaries).

## Architecture and Components

- `packages/build-graph/src/domain/schema.ts`
  - Single source of truth for domain contracts using Effect `Schema`.
  - No standalone domain interfaces unless schema representation is not possible.
- `packages/build-graph/src/core/discover.ts`
  - Recursive Markdown discovery and stable path normalization.
- `packages/build-graph/src/core/validate.ts`
  - Frontmatter parsing/validation and duplicate permalink detection.
- `packages/build-graph/src/core/resolve.ts`
  - Case-insensitive path/filename/alias resolution and ambiguity detection.
- `packages/build-graph/src/core/build.ts`
  - Graph assembly (`Graph.DirectedGraph<NodeData, EdgeData>`) with placeholders.
- `packages/build-graph/src/core/snapshot.ts`
  - Deterministic snapshot conversion and stable JSON payload ordering.
- `packages/build-graph/src/cli/main.ts`
  - CLI declaration and parsing with `effect/unstable/cli`.
  - Argument validation, orchestration, backup/write behavior, and exit codes.
- `packages/build-graph/src/index.ts`
  - Public library API exports.

## Data Flow

1. Recursively discover Markdown files under `from`.
2. Normalize to stable relative POSIX paths and sort lexicographically.
3. Parse frontmatter/body for every discovered file.
4. Validate all frontmatter first and collect all schema errors.
5. Detect duplicate `permalink` values and report all duplicate groups with file paths.
6. If schema or duplicate errors exist, fail before link parsing/assembly.
7. Build resolution indexes from valid notes by permalink, normalized path/basename, and normalized aliases.
8. Parse wikilinks from body for `[[target]]` and `[[target|display]]`.
9. Resolve in precedence order: path match, then filename match, then alias match (case-insensitive).
10. If resolution is ambiguous, record hard-failure diagnostics and stop build.
11. If unresolved, create/reuse a placeholder node and continue.
12. Assemble directed graph with note and placeholder nodes plus link edges.
13. Convert graph and diagnostics to deterministic snapshot payload.
14. CLI writes snapshot with backup policy.

## Error Handling

Hard failures (non-zero exit):

- Invalid CLI arguments.
- Unreadable or missing `from` directory.
- Frontmatter schema validation errors (after validating all files).
- Duplicate permalink groups.
- Ambiguous link resolution.
- Snapshot backup/write filesystem failures.

Non-hard diagnostics:

- Unresolved links (placeholder nodes are created).
- Optional summary diagnostics (scan counts, parsed link counts).

## Testing Expectations

Unit tests:

- Frontmatter schema validation and `published` default behavior.
- Duplicate permalink group reporting.
- Wikilink parser for selected syntax.
- Case-insensitive resolution precedence.
- Ambiguity hard-failure behavior.
- Placeholder creation for unresolved links.

Integration / CLI tests:

- End-to-end fixture directory to deterministic snapshot.
- CLI argument validation and exit-code behavior.
- `effect/unstable/cli` command/option parsing behavior for required args.
- Output backup behavior when snapshot already exists.

Determinism tests:

- Repeated runs on unchanged input are byte-identical.
- Snapshot contract shape conforms to schema-first domain contracts.

## Constraints and Assumptions

- Package manager: Bun.
- Base branch: `main`.
- CLI implementation uses `effect/unstable/cli` (no ad-hoc argv parsing).
- Effect v4 best practices are required (`Effect.gen`, typed/tagged errors, Schema-first modeling, and scoped Layer/service usage where useful).
- Deterministic output is required and excludes nondeterministic fields.
- Snapshot serialization uses sorted arrays and `JSON.stringify(..., null, 2)`.
- No `generatedAt` timestamp is included in `graph-snapshot.json`.

## Dependencies

- Effect v4 (`effect` and `@effect/platform-node` from workspace catalog).
- `effect/unstable/cli` for command/option parsing and CLI runtime wiring.
- Bun workspace/tooling and monorepo scripts.
- Filesystem access to source markdown tree and destination snapshot directory.

## Risks and Mitigations

- Risk: Link resolution ambiguity creates hard failures in larger content sets.
  - Mitigation: deterministic precedence rules and explicit candidate diagnostics.
- Risk: Frontmatter quality regressions block graph assembly.
  - Mitigation: aggregate schema diagnostics across all files before failing.
- Risk: Snapshot drift from unstable ordering.
  - Mitigation: enforce stable discovery, node/edge ordering, and deterministic serialization.
- Risk: Over-scoping toward Obsidian parity delays delivery.
  - Mitigation: enforce non-goals and YAGNI boundaries for v1.

## Open Questions (`TODO: Confirm`)

- TODO: Confirm exact accepted ISO format for `created` and `updated` (date-only vs full datetime, timezone rules).
