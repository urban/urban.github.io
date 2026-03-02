---
name: build-graph-remove-v1
created: 2026-03-01
updated: 2026-03-01
---

## Problem Statement

`@urban/build-graph` still has v1-named code paths, exports, tests, and CLI messaging. This legacy surface is no longer needed and conflicts with v2-only intent. Keep v1 references only in `packages/build-graph/README.md`; remove v1-related code everywhere else.

## Goals

- Remove all v1-related code references outside `packages/build-graph/README.md`.
- Keep current wikilink resolution behavior (`path -> filename -> alias`) unchanged.
- Expose only v2-oriented library API surface.
- Keep CLI as composition boundary for filesystem I/O and Effect error handling.
- Ship as a breaking release with explicit migration/changelog notes.

## Non-Goals

- No resolver algorithm changes.
- No snapshot schema changes beyond existing v2 contract.
- No compatibility shims or deprecation bridge.
- No cross-repo consumer rewrites in this design.

## Success Criteria

- `rg -n "\\bv1\\b|V1" packages/build-graph` matches only in `packages/build-graph/README.md`.
- No public exports with `V1` names.
- `buildGraphSnapshot` no longer accepts external resolver index input.
- CLI pipeline composes: `validateMarkdownSources` -> `parseWikilinks` -> `buildGraphSnapshot`.
- CLI logs and exits non-zero on tagged Effect errors.
- `bun run --cwd packages/build-graph test` and `bun run --cwd packages/build-graph typecheck` pass.
- Release notes/changelog call out breaking API removals and v2-only surface.

## Approach

Apply a hard cutover to v2-only code:

- Remove v1 compatibility API and references in code/tests.
- Internalize resolver index construction inside `buildGraphSnapshot`.
- Preserve behavior and diagnostics semantics used by v2 snapshot generation.
- Keep v1 narrative only in README migration/history docs.

## Architecture and Components

- `src/core/build.ts`
  - Change `buildGraphSnapshot` signature to accept validated notes + parsed wikilinks only.
  - Build resolver index internally and resolve links internally.
  - Keep ambiguity error + unresolved placeholder behavior.
- `src/core/resolve.ts`
  - Keep only internals required by v2 build flow.
  - Remove v1 compatibility surface from exports and call sites.
- `src/index.ts`
  - Curate exports to v2-oriented API only.
  - Keep `runWithArgs` as programmatic CLI entrypoint.
- `src/cli/main.ts`
  - Remains composition layer and FS boundary.
  - Compose validation, parsing, snapshot build in simple Effect pipeline.
  - Catch tagged errors at CLI boundary, log, and return failure.
- `test/*`
  - Remove v1 compatibility/parity tests and assertions.
  - Update tests to validate behavior via v2 API only.

## Data Flow

1. CLI discovers markdown files and reads sources (FS boundary).
2. CLI calls `validateMarkdownSources`.
3. CLI parses bodies via `parseWikilinks`, attaching `sourceRelativePath`.
4. CLI calls `buildGraphSnapshot(validatedNotes, parsedWikilinksWithSource)`.
5. Build stage resolves links using internal resolver index.
6. CLI serializes snapshot and writes `graph-snapshot.json` (and backup when replacing).
7. CLI catches/logs typed failures and exits non-zero.

## Error Handling

- Keep tagged errors:
  - `BuildGraphFrontmatterValidationError`
  - `BuildGraphDuplicatePermalinkError`
  - `BuildGraphAmbiguousWikilinkResolutionError`
- Ambiguous links remain hard failure with diagnostics.
- Unresolved links remain snapshot diagnostics with placeholder nodes.
- Remove v1 wording from CLI logs.

## Testing Expectations

- Update unit/integration tests for new `buildGraphSnapshot` signature.
- Remove tests that verify v1 surface preservation.
- Keep/add tests for:
  - precedence `path -> filename -> alias`
  - ambiguity failure diagnostics
  - unresolved placeholder/diagnostic behavior
  - deterministic normalized snapshot output
  - curated public API v2-only exports
- Validate with package test + typecheck commands.

## Constraints and Assumptions

- Minimal, surgical changes.
- No `any`, no non-null assertions, no type assertions.
- Illegal states remain unrepresentable at typed boundaries.
- README is only allowed location for v1 references.

## Rollout / Migration Notes

- Treat as breaking release (major).
- Changelog must include removed exports and required call-site changes:
  - resolver index no longer provided by caller.
  - removed v1-named resolver exports/types.
- README keeps v1 historical/migration context.

## Risks and Mitigations

- Risk: hidden internal/external consumers depend on removed resolver exports.
  - Mitigation: explicit breaking-change notes + public API test lock.
- Risk: behavior regression while internalizing resolver index.
  - Mitigation: behavior-focused tests for precedence/ambiguity/unresolved flows.

## Dependencies

- Bun test/typecheck tooling.
- Existing Effect CLI/runtime stack in package.

## Open Questions (`TODO: Confirm`)

- None currently.
