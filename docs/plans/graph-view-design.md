---
name: graph-view
created: 2026-02-28
updated: 2026-02-28
---

## Problem Statement

Create a new workspace package at `packages/graph-view` that renders `@urban/build-graph` snapshot output into Mermaid graph syntax, plus a CLI that writes that Mermaid graph into a Markdown file for documentation and sharing workflows.

## Goals

- Add a new package at `packages/graph-view`.
- Support library input as either a `GraphSnapshot` object or a JSON string.
- Render Mermaid output using `graph LR` layout.
- Render unresolved placeholder nodes with a distinct Mermaid class/style.
- Keep edges unlabeled (Obsidian-like graph semantics).
- Provide a CLI that accepts a required snapshot file path (`from`) and required Markdown output file path (`to`).
- Write Markdown output with a `## Graph` heading and fenced `mermaid` block.
- Validate snapshot input against `GraphSnapshotSchema`.
- Keep renderer output deterministic for stable diffs.

## Non-Goals

- Building an interactive UI graph viewer.
- Supporting additional graph output formats (DOT, SVG, PNG) in v1.
- Introducing edge labels in Mermaid output.
- Adding watch mode or incremental graph updates.
- Re-implementing graph construction logic already owned by `@urban/build-graph`.

## Success Criteria

- Library renders valid Mermaid text from valid `GraphSnapshot` object input.
- Library renders valid Mermaid text from valid JSON string input.
- CLI reads `graph-snapshot.json` via `from` and writes Markdown via `to`.
- Generated Markdown contains `## Graph` and a fenced Mermaid code block.
- Placeholder nodes are visibly distinct from note nodes.
- Edge lines are unlabeled.
- Invalid JSON and invalid snapshot schema inputs fail clearly.
- Repeated runs with unchanged input produce byte-identical Markdown output.

## Approach

Use a thin renderer architecture:

- Core pure rendering functions convert validated `GraphSnapshot` data into Mermaid and Markdown strings.
- A lightweight decode layer accepts `GraphSnapshot | string` and validates input through `GraphSnapshotSchema`.
- CLI is an adapter around filesystem IO + decode + render, with no graph transformation logic beyond orchestration.

This keeps v1 small, fast to deliver, and easy to extend without introducing a separate view-model or plugin framework.

## Architecture and Components

- `packages/graph-view/src/core/decode.ts`
  - Accepts `GraphSnapshot | string`.
  - Parses JSON when input is string.
  - Validates/decodes using exported schema contracts from `@urban/build-graph`.

- `packages/graph-view/src/core/render-mermaid.ts`
  - Renders deterministic Mermaid graph text with `graph LR`.
  - Emits note nodes.
  - Emits unresolved placeholder nodes with dedicated class/style.
  - Emits unlabeled edges.

- `packages/graph-view/src/core/render-markdown.ts`
  - Wraps Mermaid output in Markdown:
    - `## Graph`
    - fenced `mermaid` code block.

- `packages/graph-view/src/cli/main.ts`
  - Effect CLI entrypoint.
  - Required args: `from` (snapshot file path), `to` (output markdown path).
  - Reads snapshot file, decodes, renders markdown, ensures `to` parent directories exist, writes output.

- `packages/graph-view/src/index.ts`
  - Public exports for decode and render APIs.

## Data Flow

CLI flow:

1. Parse required `from` and `to` CLI arguments.
2. Read snapshot JSON text from `from`.
3. Decode to `GraphSnapshot` using schema validation.
4. Render deterministic Mermaid text (`graph LR`, nodes, unlabeled edges, placeholder styling).
5. Wrap Mermaid text as Markdown section and fenced block.
6. Create missing parent directories for `to`.
7. Write Markdown to `to`.
8. Exit non-zero on argument/read/decode/write failure.

Library flow:

1. Accept `GraphSnapshot | string`.
2. Decode once into validated `GraphSnapshot`.
3. Render Mermaid and/or Markdown via pure functions.

## Error Handling

Hard failures:

- Missing/invalid required CLI args.
- `from` path missing, unreadable, or not a file.
- JSON parse failure for string/file input.
- Schema decode failure against `GraphSnapshotSchema`.
- `to` write failure (permission denied, invalid path, or other filesystem error).

Non-fatal behavior:

- Unresolved placeholders are rendered as styled nodes, not treated as runtime errors.

## Testing Expectations

Unit tests:

- Decode input variants:
  - valid `GraphSnapshot` object.
  - valid JSON string.
  - invalid JSON string.
  - schema-invalid payload.
- Mermaid rendering:
  - starts with `graph LR`.
  - includes note nodes and placeholder nodes.
  - includes placeholder class/style definitions.
  - emits unlabeled edges.
  - deterministic output ordering.
- Markdown rendering:
  - includes `## Graph`.
  - includes fenced `mermaid` block containing exact Mermaid output.

CLI integration tests:

- Successful path from snapshot file to markdown file.
- Successful path where `to` parent directories do not exist (directories are created automatically).
- Argument validation failures.
- Invalid JSON and schema decode failures.
- Missing input / write failure scenarios.
- Determinism across repeated unchanged runs.

## Constraints and Assumptions

- Monorepo package manager is Bun.
- Base branch is `main`.
- CLI is built with Effect CLI APIs, matching repository conventions.
- Snapshot schema contract is sourced from `@urban/build-graph` and is the single input contract for rendering.

## Dependencies

- `@urban/build-graph` for `GraphSnapshot` type/schema contract.
- `effect` and `@effect/platform-node` for CLI/runtime patterns.
- Bun workspace tooling.
