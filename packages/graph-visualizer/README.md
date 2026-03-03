# @urban/graph-visualizer

Render a `@urban/build-graph` snapshot into a standalone offline HTML graph artifact.

## CLI

Show help:

```bash
bun run --cwd packages/graph-visualizer cli -- --help
```

Run from monorepo root:

```bash
bun run --cwd packages/graph-visualizer cli -- <from> <to>
```

Example:

```bash
bun run --cwd packages/graph-visualizer cli -- ./packages/graph-view/public/graph-snapshot.json ./artifacts/graph.html
```

- `<from>`: existing graph snapshot JSON file.
- `<to>`: destination HTML file path (parent dirs created if missing).

If using Bun workspaces, this also works:

```bash
bun --filter @urban/graph-visualizer run cli -- <from> <to>
```

## Failure Semantics

CLI exits with tagged errors:

- `GraphVisualizerCliValidationError` for invalid `from`/`to` paths.
- `GraphVisualizerCliFileSystemError` for filesystem operations (`exists`, `stat`, `readFile`, `makeDirectory`, `writeFile`).
- `GraphVisualizerJsonParseError` for malformed JSON input.
- `GraphVisualizerSnapshotValidationError` for schema-invalid snapshot payloads.
- `GraphVisualizerModelIntegrityError` for model integrity violations (duplicate node ids, missing edge endpoints, invalid note labels).
- `GraphVisualizerArtifactTooLargeError` when rendered HTML exceeds configured max bytes.

Default max artifact size is `GRAPH_VISUALIZER_MAX_ARTIFACT_BYTES` (`25 * 1024 * 1024`).

## Public API (Curated v1)

Supported exports from `@urban/graph-visualizer`:

- `runWithArgs`
- `decodeGraphSnapshot`
- `buildGraphRenderModel`
- `renderHtmlFromModel`
- `renderHtmlFromSnapshot`
- `GraphSnapshotSchema`
- `GRAPH_VISUALIZER_MAX_ARTIFACT_BYTES`
- tagged errors:
  - `GraphVisualizerCliValidationError`
  - `GraphVisualizerCliFileSystemError`
  - `GraphVisualizerJsonParseError`
  - `GraphVisualizerSnapshotValidationError`
  - `GraphVisualizerModelIntegrityError`
  - `GraphVisualizerArtifactTooLargeError`

Not part of curated surface:

- CLI internals (`graphVisualizerCommand`, `runGraphVisualizer`, input/internal helper types).
- low-level domain helper schemas/types beyond `GraphSnapshotSchema`.

## Development

Run tests:

```bash
bun run --cwd packages/graph-visualizer test
```

Run typecheck:

```bash
bun run --cwd packages/graph-visualizer typecheck
```

Run Playwriter browser invariants:

```bash
PLAYWRITER_SESSION_ID=<session-id> bun run --cwd packages/graph-visualizer test:browser:smoke
```

- Requires an active Playwriter session bound to local Chrome:
  `bunx playwriter@latest session new`
- Browser check validates local `file://` artifact, single-canvas root invariants, and no external network/runtime resources.
