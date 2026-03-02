---
name: graph-view-v2
created: 2026-03-02
updated: 2026-03-02
---

## Problem Statement

Teams generating `@urban/build-graph` snapshots need reliable Mermaid markdown output. `@urban/graph-view` currently uses a local snapshot contract that can drift from producer contract. With build-graph v2 (`schemaVersion: "2"`, required indexes), graph-view must align hard and modernize internals to Effect v4 patterns.

## Goals

- accept only build-graph v2 snapshot input.
- use build-graph snapshot schema/type as single contract source.
- keep CLI usage unchanged.
- refactor internals to Effect-native decode/model/render with tagged errors.
- move runtime boundary to Bun Effect platform.
- render Mermaid through Effect Graph native Mermaid support.
- preserve deterministic output for stable diffs.

## Non-Goals

- no v1 snapshot compatibility mode.
- no interactive UI viewer.
- no additional output formats beyond Mermaid-in-Markdown.
- no byte-identical output guarantee vs prior graph-view renderer.
- no custom Mermaid line renderer unless native Effect Graph cannot satisfy requirements.

## Success Criteria

- valid v2 snapshot object input renders successfully.
- valid v2 snapshot JSON string input renders successfully.
- non-v2 or schema-invalid input fails clearly at decode boundary.
- CLI command and args stay unchanged for users.
- output is deterministic for unchanged semantic input.
- placeholders remain visually distinct via shape.
- edges remain unlabeled.
- invalid edge references to missing nodes fail fast.
- public API is minimal and avoids duplicate schema surface.

## Solution

Deliver a v2-only graph-view hard cutover with Effect-native internals. Validate inputs using producer-owned schema, normalize into constrained render model, construct Effect Graph, generate Mermaid with native `toMermaid`, and wrap in markdown for docs workflows. Keep side effects in CLI boundary and preserve existing CLI UX.

## User Stories

1. As a docs maintainer, I want to pass a v2 graph snapshot and get Mermaid markdown, so that graph docs stay easy to publish.
2. As a CLI user, I want command usage unchanged, so that existing scripts keep working.
3. As a platform engineer, I want graph-view to validate against producer-owned schema, so that contract drift cannot happen silently.
4. As an integrator, I want non-v2 snapshots to fail clearly, so that migration issues are caught early.
5. As a reviewer, I want unresolved nodes visually distinct, so that missing links stand out.
6. As a reviewer, I want unlabeled edges, so that graph view stays simple and consistent.
7. As a maintainer, I want deterministic output, so that diffs reflect real changes only.
8. As a maintainer, I want tagged error categories, so that parse, validation, and IO failures are easy to triage.
9. As a reliability owner, I want missing edge endpoints to fail fast, so that broken data never renders misleading graphs.
10. As a package consumer, I want a small stable API, so that upgrades are lower risk.
11. As a tooling engineer, I want filesystem effects isolated to CLI boundary, so that library code stays pure/testable.
12. As a future contributor, I want Effect-native patterns used consistently, so that new changes follow one model.

## Implementation Decisions

- hard cut to v2-only snapshot contract; no legacy adapter.
- producer package schema/type is sole validation contract for renderer input.
- decode boundary accepts object or JSON text and returns typed validated snapshot.
- render pipeline uses constrained ADT model before graph construction to make invalid states harder to represent.
- rendering uses Effect Graph construction and native Mermaid export.
- Mermaid config uses LR direction and empty edge labels.
- placeholder distinction implemented through node shape mapping.
- referential integrity enforced: edges must reference existing nodes or fail.
- CLI boundary handles all filesystem concerns and directory creation.
- runtime/services align to Bun platform stack.
- public exports curated to decode/render/cli essentials plus tagged errors.

## Dependencies

- `effect` v4 core modules and Graph Mermaid support.
- Bun platform runtime/services for CLI boundary.
- `@urban/build-graph` v2 snapshot schema/type contract.
- Bun workspace tooling.

## Testing Decisions

- decode behavior tests for valid v2 object/string and invalid JSON/schema/non-v2 payloads.
- render behavior tests for direction, unlabeled edges, placeholder shape distinction, and determinism under reordered input.
- invariant tests that missing edge endpoint references fail fast.
- markdown wrapper tests for stable section/fence structure.
- CLI integration tests for success path, auto-create output parents, and failure paths across args/path/read/write/decode.
- public API surface tests to enforce curated export contract.

## Further Notes

- derived from `docs/plans/graph-view-v2-design.md`.
- this PRD intentionally excludes v1 compatibility.
- GitHub issue: https://github.com/urban/urban.github.io/issues/48
- TODO: Confirm none.
