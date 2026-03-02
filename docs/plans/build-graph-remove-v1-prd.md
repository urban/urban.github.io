---
name: build-graph-remove-v1
created: 2026-03-01
updated: 2026-03-01
---

## Problem Statement

`@urban/build-graph` still carries v1 compatibility surface in code, tests, and API naming. This creates confusion and maintenance cost even though product intent is v2-only output. Team needs hard removal of v1 functionality, with v1 mention allowed only in README history/migration docs.

## Goals

- Remove v1 functionality and references from runtime code, tests, and public API.
- Keep wikilink resolution behavior unchanged (`path -> filename -> alias`).
- Keep CLI as composition + filesystem boundary.
- Keep library focused on typed in-memory transformations.
- Ship as breaking change with explicit migration notes.

## Non-Goals

- No resolver algorithm change.
- No snapshot contract change beyond existing v2 contract.
- No compatibility shim/deprecation bridge.
- No cross-repo consumer rewrites in this PRD scope.

## Success Criteria

- Search for `v1`/`V1` inside package matches only README.
- Public API contains no v1-named exports or v1 compatibility helpers.
- Snapshot build API no longer requires caller-provided resolver index.
- CLI pipeline is validate -> parse -> build snapshot -> serialize/write.
- CLI logs typed failures and exits non-zero on failure.
- Package tests and typecheck pass.
- Release notes/changelog clearly call out breaking removals.

## Solution

Cut to v2-only behavior and surface now. Keep resolver matching semantics identical, but internalize resolver indexing and remove v1 compatibility APIs. Keep CLI behavior stable for users while simplifying internal contracts and reducing exposed API area.

## User Stories

1. As a package maintainer, I want v1 code removed, so that maintenance burden drops.
2. As a library consumer, I want only v2-oriented exports, so that API intent is clear.
3. As a CLI user, I want command flow unchanged, so that upgrade friction stays low.
4. As a CLI user, I want typed errors logged clearly, so that failures are actionable.
5. As an integrator, I want the snapshot builder to accept validated notes + parsed links directly, so that usage is simple.
6. As an integrator, I want ambiguity to still fail hard, so that incorrect edges do not silently ship.
7. As a content author, I want unresolved links preserved as diagnostics, so that missing targets stay visible.
8. As a reviewer, I want v1 mentions restricted to README only, so that codebase reflects v2 reality.
9. As a release owner, I want explicit breaking-change notes, so that downstream upgrades are predictable.
10. As a test owner, I want behavior-focused tests retained, so that refactor safety stays high.

## Implementation Decisions

- Remove v1 compatibility surface from public exports.
- Keep programmatic CLI entrypoint export.
- Keep CLI as effectful composition layer; keep filesystem access there.
- Expose library functions for validation, parsing, and snapshot construction.
- Internalize resolver index construction inside snapshot build flow.
- Preserve resolution precedence and ambiguity/unresolved semantics exactly.
- Remove v1-only test intent; keep v2 behavior assertions.
- Keep error taxonomy typed and explicit at boundaries.
- Treat release as major due to removed API surface.

## Dependencies

- Effect runtime/schema/cli stack already used by package.
- Bun workspace tooling for test/typecheck/release workflows.
- Downstream consumers of removed v1 exports.

## Testing Decisions

- Validate precedence behavior remains path before filename before alias.
- Validate ambiguous matches still produce hard typed failure with diagnostics.
- Validate unresolved matches still generate placeholder nodes + diagnostics.
- Validate deterministic normalized snapshot output remains stable.
- Validate curated public API exposes only v2-oriented surface.
- Validate CLI pipeline composes validation, parsing, build, serialization, and error logging.
- Run package test and typecheck as merge gate.

## Further Notes

- Design source: `build-graph-remove-v1-design.md`.
- README remains only allowed location for v1 references.
- TODO: Confirm exact major version target for release.
- GitHub issue: https://github.com/urban/urban.github.io/issues/42
