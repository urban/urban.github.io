# @urban/graph-view

Render deterministic Mermaid graph Markdown from a `graph-snapshot.json` file (typically produced by `@urban/build-graph`).

## What it does

- Validates snapshot input with `@urban/build-graph` `GraphSnapshotSchema`.
- Accepts either a parsed snapshot object or JSON string in library APIs.
- Renders Mermaid with `graph LR` layout.
- Renders note nodes using `relativePath`.
- Renders unresolved placeholder nodes with distinct shape.
- Renders unlabeled edges (Obsidian-like graph semantics).
- Wraps Mermaid output in Markdown (`## Graph` + fenced `mermaid` block).

## v2 contract only

- Input must match build-graph v2 contract (`schemaVersion: "2"` with required `indexes`).
- No v1 compatibility mode.

## CLI

Show help:

```bash
bun run --cwd packages/graph-view cli -- --help
```

Run from monorepo root:

```bash
bun run --cwd packages/graph-view cli -- <from> <to>
```

Example:

```bash
bun run --cwd packages/graph-view cli -- ./tmp/graph-snapshot.json ./docs/graph.md
```

- `<from>`: existing `graph-snapshot.json` file.
- `<to>`: output Markdown path. Parent dirs auto-created.

Workspace usage:

```bash
bun --filter @urban/graph-view run cli -- <from> <to>
```

### CLI validation and failures

Command fails when:

- `<from>` does not exist.
- `<from>` exists but is not a file.
- `<to>` exists but is not a file.
- `<to>` parent exists but is not a directory.
- snapshot JSON is invalid.
- snapshot JSON does not match build-graph v2 `GraphSnapshotSchema`.

## Snapshot input contract

Snapshot shape:

- `schemaVersion`: must be `"2"`.
- `nodes`: array of note or placeholder nodes.
- `edges`: array of wikilink edges.
- `diagnostics`: array of unresolved wikilink diagnostics.
- `indexes`: required (`nodesById`, `edgesBySourceNodeId`, `edgesByTargetNodeId`).

Minimal valid example:

```json
{
  "schemaVersion": "2",
  "nodes": [
    {
      "id": "notes/a.md",
      "kind": "note",
      "relativePath": "notes/a.md",
      "permalink": "/a"
    },
    {
      "id": "placeholder:missing",
      "kind": "placeholder",
      "unresolvedTarget": "missing"
    }
  ],
  "edges": [
    {
      "sourceNodeId": "notes/a.md",
      "targetNodeId": "placeholder:missing",
      "sourceRelativePath": "notes/a.md",
      "rawWikilink": "[[missing]]",
      "target": "missing",
      "resolutionStrategy": "unresolved"
    }
  ],
  "diagnostics": [
    {
      "type": "unresolved-wikilink",
      "sourceRelativePath": "notes/a.md",
      "rawWikilink": "[[missing]]",
      "target": "missing",
      "placeholderNodeId": "placeholder:missing"
    }
  ],
  "indexes": {
    "nodesById": {
      "notes/a.md": {
        "id": "notes/a.md",
        "kind": "note",
        "relativePath": "notes/a.md",
        "permalink": "/a"
      },
      "placeholder:missing": {
        "id": "placeholder:missing",
        "kind": "placeholder",
        "unresolvedTarget": "missing"
      }
    },
    "edgesBySourceNodeId": {
      "notes/a.md": [
        {
          "sourceNodeId": "notes/a.md",
          "targetNodeId": "placeholder:missing",
          "sourceRelativePath": "notes/a.md",
          "rawWikilink": "[[missing]]",
          "target": "missing",
          "resolutionStrategy": "unresolved"
        }
      ]
    },
    "edgesByTargetNodeId": {
      "placeholder:missing": [
        {
          "sourceNodeId": "notes/a.md",
          "targetNodeId": "placeholder:missing",
          "sourceRelativePath": "notes/a.md",
          "rawWikilink": "[[missing]]",
          "target": "missing",
          "resolutionStrategy": "unresolved"
        }
      ]
    }
  }
}
```

`resolutionStrategy` is one of: `path`, `filename`, `alias`, `unresolved`.

## Library usage

```ts
import { Effect } from "effect"
import { type GraphSnapshot } from "@urban/build-graph"
import {
  decodeGraphSnapshot,
  renderMarkdownFromSnapshot,
  renderMermaidFromSnapshot,
} from "@urban/graph-view"

const snapshotText = await Bun.file("./tmp/graph-snapshot.json").text()
const snapshot: GraphSnapshot = await Effect.runPromise(decodeGraphSnapshot(snapshotText))

const mermaid = renderMermaidFromSnapshot(snapshot)
const markdown = renderMarkdownFromSnapshot(snapshot)
```

### Exported API (top level)

- CLI:
  - `graphViewCommand`
  - `runGraphView`
  - `runWithArgs`
  - `GraphViewCliValidationError`
  - `GraphViewCliReadError`
  - `GraphViewCliWriteError`
- Decode:
  - `decodeGraphSnapshot`
  - `GraphViewJsonParseError`
  - `GraphViewSnapshotValidationError`
- Rendering:
  - `renderMermaidFromSnapshot`
  - `renderMarkdownFromSnapshot`

Snapshot contract types/schemas are owned by `@urban/build-graph` and are not re-exported by this package.

## Determinism

Renderer output is stable and sorted, so unchanged semantic input produces byte-identical Mermaid/Markdown output.

## Development

Run tests:

```bash
bun run --cwd packages/graph-view test
```

Run typecheck:

```bash
bun run --cwd packages/graph-view typecheck
```
