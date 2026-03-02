---
name: graph-view
created: 2026-02-28
updated: 2026-02-28
---

## Problem Statement

Teams that already generate `graph-snapshot.json` need a consistent way to turn that snapshot into shareable graph documentation. Today there is no standard renderer in this repo for converting snapshot data into Mermaid diagrams and embedding those diagrams in Markdown, which makes graph communication ad hoc and harder to automate.

## Goals

- Deliver a reusable `graph-view` library that converts snapshot data into Mermaid graph text.
- Support library input as either a parsed snapshot object or a JSON string.
- Validate all input against the existing snapshot schema contract before rendering.
- Render Mermaid output using `graph LR` layout semantics.
- Render unresolved placeholder nodes with a distinct visual style from note nodes.
- Keep edges unlabeled to match intended graph semantics.
- Deliver a CLI that reads a required snapshot input path and writes a required Markdown output path.
- Emit Markdown output with a `## Graph` heading and fenced `mermaid` block.
- Keep output deterministic so unchanged input produces stable diffs.

## Non-Goals

- Building an interactive browser-based graph viewer.
- Supporting output formats beyond Mermaid-in-Markdown in v1.
- Adding edge labels, weighting, or other relationship metadata in rendered output.
- Re-implementing or extending graph construction logic already owned by the snapshot-producing package.
- Adding watch mode or incremental update behavior in v1.

## Success Criteria

- Valid snapshot object input renders into valid Mermaid text.
- Valid snapshot JSON string input renders into valid Mermaid text.
- CLI successfully reads snapshot content from `from` and writes Markdown output to `to`.
- Generated Markdown always includes `## Graph` and a fenced `mermaid` code block.
- Placeholder nodes are visibly distinct from regular note nodes.
- Rendered edges are unlabeled.
- Invalid JSON or schema-invalid payloads fail with clear errors.
- Repeated unchanged runs produce byte-identical output.

## Solution

Provide a focused rendering package with two consumer paths:

- Library APIs for decode-and-render workflows from either object input or JSON string input.
- CLI orchestration for file-based workflows that reads snapshot input, validates it, renders Mermaid text, wraps it into Markdown, and writes to an output path.

The solution keeps transformation logic in pure rendering functions and limits side effects to CLI IO boundaries, making behavior easier to test, reuse, and evolve.

## User Stories

1. As a documentation maintainer, I want to convert a graph snapshot into Mermaid text, so that I can include architecture graphs in project docs.
2. As a documentation maintainer, I want Markdown output with a standard `## Graph` section, so that generated docs are consistent across teams.
3. As a CLI user, I want required `from` and `to` arguments, so that invocation is explicit and scriptable in CI.
4. As a CLI user, I want missing or invalid input paths to fail clearly, so that I can quickly correct automation failures.
5. As a library consumer, I want to pass either a parsed object or raw JSON string, so that I can integrate without adding custom preprocessing.
6. As a library consumer, I want schema-validated input before rendering, so that invalid data does not silently produce misleading diagrams.
7. As a content reviewer, I want unresolved targets rendered as distinct placeholder nodes, so that missing links remain visible during review.
8. As a content reviewer, I want edges to be unlabeled, so that the diagram remains visually simple and aligned with the intended graph view.
9. As a platform engineer, I want deterministic rendering order, so that output changes only when snapshot content changes.
10. As a platform engineer, I want renderer logic separate from file IO, so that unit tests can validate behavior without filesystem coupling.
11. As a release engineer, I want non-zero exits on decode and write failures, so that CI can reliably gate bad artifacts.
12. As a future maintainer, I want clear extension points around decoding and rendering, so that new view formats can be added later without redesigning the core.

## Implementation Decisions

- Use the existing snapshot contract as the single source of truth for accepted renderer input.
- Implement a decode layer that accepts either object or string input and normalizes to one validated internal snapshot model.
- Treat JSON parsing failure and schema validation failure as hard errors.
- Render Mermaid with a fixed `graph LR` header for predictable orientation.
- Render note nodes and placeholder nodes with distinct Mermaid classes/styles so unresolved targets are visually obvious.
- Emit unlabeled edges only.
- Preserve deterministic ordering for nodes, edges, and style declarations to keep output byte-stable.
- Keep Markdown generation as a thin wrapper around Mermaid output (`## Graph` + fenced `mermaid` block).
- Keep CLI responsibilities limited to argument parsing, file read/write, output directory creation, decode invocation, and render invocation.
- Follow repository Effect CLI/runtime conventions for command execution and typed failure handling.

## Dependencies

- `@urban/build-graph` for snapshot schema and type contracts.
- `effect` and platform runtime packages for CLI and error-model conventions.
- Bun workspace tooling for package scripts and execution.
- Mermaid syntax support in downstream Markdown renderers (consumer environment dependency).

## Testing Decisions

- Unit-test decode behavior for valid object input, valid JSON string input, invalid JSON, and schema-invalid payloads.
- Unit-test Mermaid rendering for header correctness (`graph LR`), unlabeled edge behavior, placeholder distinctness, and deterministic output.
- Unit-test Markdown wrapping to verify required section heading and fenced block structure.
- Integration-test CLI success path from snapshot input file to Markdown output file.
- Integration-test CLI behavior when output parent directories do not yet exist.
- Integration-test CLI failure paths: missing args, unreadable input, invalid JSON, schema failure, and write failures.
- Add determinism regression coverage to ensure repeated runs with unchanged input remain byte-identical.

## Further Notes

- This PRD is derived from `docs/plans/graph-view-design.md` and aligned with current repository CLI/runtime patterns.
- TODO: Confirm exact CLI command name and package binary naming convention for v1.
- TODO: Confirm placeholder visual style defaults (shape/color/class naming) expected by documentation consumers.
- TODO: Confirm escaping rules for Mermaid node identifiers and labels when note metadata contains special characters.
- GitHub issue: https://github.com/urban/urban.github.io/issues/27
