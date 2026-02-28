---
name: build-graph
created: 2026-02-26
updated: 2026-02-26
---

## Problem Statement

Teams maintaining Markdown knowledge bases need a reliable way to turn notes and links into a portable graph artifact for downstream tooling. Today, graph creation is not standardized around strict frontmatter validation, deterministic output, or consistent link resolution semantics. This creates fragile pipelines, inconsistent snapshots, and unclear failure modes when links are invalid, ambiguous, or unresolved.

## Goals

- Deliver a reusable TypeScript library that builds a graph from Markdown notes.
- Deliver a CLI that generates `graph-snapshot.json` from a required source directory and destination directory.
- Use Effect v4 Graph as the canonical in-memory model.
- Enforce schema-first frontmatter validation before graph assembly.
- Parse Obsidian-style wikilinks in supported forms and resolve links case-insensitively by path, filename, and alias.
- Fail the build on ambiguous link resolution with candidate diagnostics.
- Represent unresolved links as placeholder nodes while preserving diagnostics.
- Produce deterministic, byte-stable snapshot output for unchanged inputs.
- Back up an existing snapshot before overwrite.

## Non-Goals

- Building UI or graph visualization experiences.
- Supporting watch mode or incremental updates.
- Supporting non-Markdown content formats.
- Achieving full Obsidian compatibility beyond explicitly supported wikilink forms.
- Integrating external network APIs.

## Success Criteria

- CLI successfully writes `graph-snapshot.json` for valid inputs.
- Snapshot includes valid note nodes plus placeholder nodes for unresolved targets.
- Frontmatter and duplicate-permalink issues are fully reported and block assembly.
- Ambiguous link matches fail with actionable candidate details.
- Repeated runs against unchanged input produce byte-identical output.
- Existing snapshot files are backed up before replacement.

## Solution

Provide a two-phase graph build pipeline surfaced through both library APIs and a CLI:

- Phase 1 validates source quality by discovering Markdown notes, parsing frontmatter and body, validating schema, and checking permalink uniqueness.
- Phase 2 parses supported wikilinks, resolves targets via deterministic precedence rules, assembles a directed graph, and serializes a deterministic snapshot payload.

The system should stop early on hard data integrity failures (invalid schema, duplicate permalinks, ambiguous resolution), while unresolved links should remain visible via placeholder nodes and diagnostics so users can ship snapshots with known gaps.

## User Stories

1. As a knowledge-base maintainer, I want to run one CLI command with source and destination arguments, so that I can generate a graph snapshot in automation pipelines.
2. As a knowledge-base maintainer, I want all Markdown notes recursively discovered, so that nested notes are included without manual file lists.
3. As a content editor, I want invalid frontmatter to be fully reported across all files, so that I can fix all schema issues in one pass.
4. As a content editor, I want duplicate permalinks surfaced with all conflicting notes, so that I can remove identity conflicts before graph generation.
5. As a content editor, I want wikilinks like `[[target]]` and `[[target|display]]` interpreted consistently, so that authored links behave predictably.
6. As a content editor, I want case-insensitive link resolution using path, filename, and alias, so that minor casing differences do not break links.
7. As a maintainer, I want ambiguous link matches to fail the build with clear candidates, so that incorrect graph edges are never silently produced.
8. As a maintainer, I want unresolved links represented as placeholders, so that missing targets are visible without dropping source-link intent.
9. As a platform engineer, I want stable sorting and deterministic serialization, so that unchanged input produces byte-identical snapshots for reliable diffs.
10. As a platform engineer, I want backup-on-overwrite behavior for existing snapshots, so that previous outputs are recoverable.
11. As a library consumer, I want typed domain contracts and typed errors, so that integration behavior is explicit and safe.
12. As a release engineer, I want clear non-zero exits for hard failures, so that CI can reliably gate invalid content states.

## Implementation Decisions

- Use Effect Schema-first modeling as the source of truth for note metadata, graph node data, edge data, and snapshot payload contracts.
- Build the pipeline in distinct phases to separate validation concerns from link resolution and graph assembly.
- Enforce note `created` and `updated` values in ISO date-only format: `YYYY-MM-DD`.
- Normalize discovered paths into a stable, relative POSIX form and sort lexicographically before downstream processing.
- Validate all frontmatter first and aggregate schema diagnostics before any graph assembly.
- Treat duplicate permalinks as hard failures and report duplicate groups with full candidate context.
- Parse only explicitly supported wikilink formats for v1.
- Resolve links in deterministic precedence order: path match, then filename match, then alias match (case-insensitive).
- Treat ambiguous resolution as a hard failure with candidate diagnostics.
- Treat unresolved links as non-hard diagnostics and create/reuse placeholder nodes for those targets.
- Keep placeholder nodes user-visible in outputs and stable across runs for unchanged input.
- Preserve deterministic ordering of nodes, edges, and diagnostics in the final snapshot payload.
- Serialize snapshots with stable JSON formatting and exclude nondeterministic fields (for example runtime timestamps).
- Provide a CLI built with Effect’s unstable CLI APIs using required `from` and `to` arguments, with explicit argument validation and exit-code semantics.
- Use typed/tagged errors for hard failure classes and diagnostics structures for non-hard issues.
- Back up any existing snapshot before writing a new one.

## Dependencies (optional)

- Effect v4 runtime and graph/data tooling.
- Effect unstable CLI package for command parsing and runtime wiring.
- Bun workspace/tooling for package execution.
- Local filesystem access to source note trees and destination output directory.

## Testing Decisions

- Unit-test schema validation behavior, including metadata defaults and error aggregation.
- Unit-test duplicate permalink detection and diagnostic detail formatting.
- Unit-test wikilink parsing coverage for supported syntax and edge cases.
- Unit-test resolution precedence and case-insensitive matching behavior.
- Unit-test ambiguity handling as a hard-failure path.
- Unit-test unresolved-link placeholder creation and reuse behavior.
- Integration-test end-to-end fixture conversion from Markdown tree to snapshot artifact.
- Integration-test CLI argument validation, required-argument behavior, and exit codes.
- Integration-test snapshot backup behavior when output already exists.
- Determinism-test byte-identical outputs across repeated runs with unchanged input.
- Contract-test snapshot payload shape against schema-defined expectations.

## Further Notes

- This PRD is derived from the design document `build-graph-design`.
- GitHub issue: https://github.com/urban/urban.github.io/issues/8
