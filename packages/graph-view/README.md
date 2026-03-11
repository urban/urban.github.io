# @urban/graph-view

Render deterministic Mermaid graph Markdown from a `graph-snapshot.json` file (typically produced by `@urban/build-graph`).

## What it does

- Validates graph snapshot input against `GraphSnapshotSchema`.
- Requires the build-graph v2 root contract: `schemaVersion: "2"` plus `indexes`.
- Accepts either a parsed snapshot object or a JSON string in library APIs.
- Renders Mermaid with `graph LR` layout.
- Renders note nodes using `title`, then `label`, then source-path fallbacks.
- Renders unresolved placeholder nodes with an `unresolved` Mermaid class/style.
- Renders unlabeled edges (Obsidian-like graph semantics).
- Wraps Mermaid output in Markdown:
  - `## Graph`
  - fenced `mermaid` code block

## CLI

Show help:

```bash
bun run --cwd packages/graph-view cli -- --help
```

Run from the monorepo root:

```bash
bun run --cwd packages/graph-view cli -- <from> <to>
```

Example:

```bash
bun run --cwd packages/graph-view cli -- ./tmp/graph-snapshot.json ./docs/graph.md
```

- `<from>`: path to an existing `graph-snapshot.json` file.
- `<to>`: path to output Markdown file. Parent directories are created if missing.

If using Bun workspaces, this also works:

```bash
bun --filter @urban/graph-view run cli -- <from> <to>
```

### CLI validation and failures

The command fails when:

- `<from>` does not exist.
- `<from>` exists but is not a file.
- `<to>` exists but is not a file.
- `<to>` parent exists but is not a directory.
- snapshot JSON is invalid.
- snapshot JSON does not match `GraphSnapshotSchema`.

`@urban/graph-view` does not accept the pre-v2 snapshot root that only contained `nodes`, `edges`, and `diagnostics`.

## Snapshot input contract

The snapshot shape is:

- `schemaVersion`: required string literal `"2"`.
- `nodes`: array of note or placeholder nodes.
- `edges`: array of wikilink edges.
- `diagnostics`: array of unresolved wikilink diagnostics.
- `indexes`: required lookup object with `nodesById`, `edgesBySourceNodeId`, `edgesByTargetNodeId`, and optional route-aware note indexes.

Minimal valid example:

```json
{
  "schemaVersion": "2",
  "nodes": [
    {
      "id": "/vault/a",
      "kind": "note",
      "relativePath": "notes/a.md",
      "sourceRelativePath": "notes/a.md",
      "permalink": "/a",
      "slug": "a",
      "routePath": "/vault/a",
      "label": "A",
      "title": "Note A"
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
      "/vault/a": {
        "id": "/vault/a",
        "kind": "note",
        "relativePath": "notes/a.md",
        "sourceRelativePath": "notes/a.md",
        "permalink": "/a",
        "slug": "a",
        "routePath": "/vault/a",
        "label": "A",
        "title": "Note A"
      },
      "placeholder:missing": {
        "id": "placeholder:missing",
        "kind": "placeholder",
        "unresolvedTarget": "missing"
      }
    },
    "edgesBySourceNodeId": {
      "/vault/a": [
        {
          "sourceNodeId": "/vault/a",
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
          "sourceNodeId": "/vault/a",
          "targetNodeId": "placeholder:missing",
          "sourceRelativePath": "notes/a.md",
          "rawWikilink": "[[missing]]",
          "target": "missing",
          "resolutionStrategy": "unresolved"
        }
      ]
    },
    "noteNodeIdBySlug": {
      "a": "/vault/a"
    },
    "noteNodeIdByRoutePath": {
      "/vault/a": "/vault/a"
    }
  }
}
```

`resolutionStrategy` is one of: `path`, `filename`, `alias`, `unresolved`.

Rendered note labels use this precedence:

- `title`
- `label`
- `sourceRelativePath`
- `relativePath`
- `routePath`
- `permalink`
- `id`

This keeps canonical-route snapshots readable without projecting route ids back into filenames.

## Library usage

```ts
import { Effect } from "effect"
import {
  decodeGraphSnapshot,
  renderMarkdownFromSnapshot,
  renderMermaidFromSnapshot,
} from "@urban/graph-view"

const snapshotText = await Bun.file("./tmp/graph-snapshot.json").text()
const snapshot = await Effect.runPromise(decodeGraphSnapshot(snapshotText))

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
- Schemas:
  - `GraphSnapshotSchema`
  - `GraphSnapshotSchemaVersionSchema`
  - `GraphSnapshotIndexesSchema`
  - `GraphSnapshotNodeSchema`
  - `GraphSnapshotNoteNodeSchema`
  - `GraphSnapshotPlaceholderNodeSchema`
  - `GraphSnapshotEdgeSchema`
  - `GraphSnapshotResolutionStrategySchema`
  - `UnresolvedWikilinkDiagnosticSchema`

## Determinism

Renderer output is stable and sorted, so unchanged snapshot input produces byte-identical Mermaid/Markdown output.

## Development

Run tests:

```bash
bun run --cwd packages/graph-view test
```

Run typecheck:

```bash
bun run --cwd packages/graph-view typecheck
```
