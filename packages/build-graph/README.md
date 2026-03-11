# @urban/build-graph

Build a deterministic `graph-snapshot.json` from a directory of Markdown notes that use wikilinks.

## What it does

- Recursively discovers `.md` files.
- Validates note frontmatter.
- Parses wikilinks (`[[target]]` and `[[target|Display Text]]`).
- Resolves links using path, filename, then alias matching.
- Writes a stable, sorted snapshot JSON for downstream graph tooling.
- Preserves the previous snapshot as `graph-snapshot.json.bak` before overwrite.

## CLI

Show help:

```bash
bun run --cwd packages/build-graph cli -- --help
```

Run from the monorepo root:

```bash
bun run --cwd packages/build-graph cli -- <from> <to>
```

Example:

```bash
bun run --cwd packages/build-graph cli -- ./notes ./packages/graph-view/public
```

- `<from>`: existing directory containing Markdown notes.
- `<to>`: destination directory for `graph-snapshot.json` (created if missing).

If using Bun workspaces, this also works:

```bash
bun --filter @urban/build-graph run cli -- <from> <to>
```

## Markdown Frontmatter Contract

Every note must include frontmatter with:

- `permalink`: non-empty string.
- `created`: ISO date in `YYYY-MM-DD` with semantic validation.
- `updated`: ISO date in `YYYY-MM-DD` with semantic validation.

Optional:

- `aliases`: array of non-empty strings (defaults to `[]`).
- `published`: boolean (defaults to `true`).
- `title`: non-empty string.
- `description`: non-empty string.

### Route-Aware Mode

Library consumers can opt into canonical route identity with:

- `identityStrategy: "canonical-route"`
- `routePrefix: "/vault"` or `"vault"`

In canonical-route mode:

- `permalink` must be a kebab-case slug segment such as `harness-loop`.
- source filenames may differ from route identity, for example `Harness Loop.md`.
- canonical route paths are derived from `routePrefix + permalink`, for example `/vault/harness-loop`.
- note node ids become canonical route paths instead of source-relative paths.

The CLI fails if:

- any file has invalid frontmatter.
- multiple files share the same `permalink`.

## Wikilink Resolution (v1)

Supported link forms:

- `[[target]]`
- `[[target|Display Text]]`

Ignored:

- embedded links like `![[image]]`.
- malformed links like `[[|missing-target]]` or `[[target|]]`.

Resolution order for `target`:

1. Path match (case-insensitive, with normalized `/` separators).
2. Filename match (case-insensitive).
3. Alias match from frontmatter `aliases` (case-insensitive).

If multiple notes match the same link target at a given strategy, the run fails with an ambiguity error.
If no note matches, a placeholder node is created and an unresolved diagnostic is recorded.

## Output

The CLI writes:

- `<to>/graph-snapshot.json`
- `<to>/graph-snapshot.json.bak` (only when replacing an existing snapshot)

Snapshot shape:

- `nodes`: note nodes and placeholder nodes.
- `edges`: wikilink edges with `resolutionStrategy` (`path` | `filename` | `alias` | `unresolved`).
- `diagnostics`: unresolved wikilink diagnostics.
- `indexes.noteNodeIdBySlug`: note lookup by canonical slug when available.
- `indexes.noteNodeIdByRoutePath`: note lookup by canonical route path when available.

Note nodes now include route-aware and UI metadata fields such as:

- `sourceRelativePath`
- `slug`
- `routePath`
- `label`
- `created`
- `updated`
- `aliases`
- `published`
- optional `title`
- optional `description`

Example unresolved placeholder node id:

- `placeholder:missing/note`

## v1 to v2 Migration Guide

v2 is a hard cutover on snapshot contract shape. CLI usage does not change.

Field mapping:

- `nodes` -> unchanged in v2.
- `edges` -> unchanged in v2.
- `diagnostics` -> unchanged in v2.
- `schemaVersion` -> new required field, always `"2"`.
- `indexes.nodesById` -> new required lookup map of `node.id` to node.
- `indexes.edgesBySourceNodeId` -> new required lookup map of `edge.sourceNodeId` to edges.
- `indexes.edgesByTargetNodeId` -> new required lookup map of `edge.targetNodeId` to edges.

Consumer checklist:

- accept and validate `schemaVersion: "2"` at read boundary.
- keep existing `nodes`/`edges`/`diagnostics` parsing logic.
- optionally switch hot-path lookups to required `indexes`.
- remove assumptions that snapshot root has only three arrays.

Before (v1 shape):

```json
{
  "nodes": [
    { "id": "source.md", "kind": "note", "relativePath": "source.md", "permalink": "/source" }
  ],
  "edges": [
    {
      "sourceNodeId": "source.md",
      "targetNodeId": "target.md",
      "sourceRelativePath": "source.md",
      "rawWikilink": "[[target]]",
      "target": "target",
      "resolutionStrategy": "path"
    }
  ],
  "diagnostics": []
}
```

After (v2 shape):

```json
{
  "schemaVersion": "2",
  "nodes": [
    { "id": "source.md", "kind": "note", "relativePath": "source.md", "permalink": "/source" }
  ],
  "edges": [
    {
      "sourceNodeId": "source.md",
      "targetNodeId": "target.md",
      "sourceRelativePath": "source.md",
      "rawWikilink": "[[target]]",
      "target": "target",
      "resolutionStrategy": "path"
    }
  ],
  "diagnostics": [],
  "indexes": {
    "nodesById": {
      "source.md": {
        "id": "source.md",
        "kind": "note",
        "relativePath": "source.md",
        "permalink": "/source"
      }
    },
    "edgesBySourceNodeId": {
      "source.md": [
        {
          "sourceNodeId": "source.md",
          "targetNodeId": "target.md",
          "sourceRelativePath": "source.md",
          "rawWikilink": "[[target]]",
          "target": "target",
          "resolutionStrategy": "path"
        }
      ]
    },
    "edgesByTargetNodeId": {
      "target.md": [
        {
          "sourceNodeId": "source.md",
          "targetNodeId": "target.md",
          "sourceRelativePath": "source.md",
          "rawWikilink": "[[target]]",
          "target": "target",
          "resolutionStrategy": "path"
        }
      ]
    }
  }
}
```

## Public API (Curated v2)

Supported exports from `@urban/build-graph`:

- `runWithArgs` (CLI entry for programmatic execution).
- `discoverMarkdownFiles`.
- `validateMarkdownSources`.
- `parseWikilinks`.
- `formatAmbiguousWikilinkResolutionDiagnostics`.
- `buildGraphSnapshot`.
- `buildGraphSnapshotFromMarkdownSources`.
- `buildGraphSnapshotFromRoot`.
- `normalizeGraphSnapshot`.
- `serializeGraphSnapshot`.
- `GraphSnapshotSchema`.
- Tagged errors:
  - `BuildGraphFrontmatterValidationError`
  - `BuildGraphDuplicatePermalinkError`
  - `BuildGraphInvalidCanonicalPermalinkError`
  - `BuildGraphAmbiguousWikilinkResolutionError`

Not part of the curated public surface:

- CLI internals/constants (`buildGraphCommand`, `runBuildGraph`, snapshot file-name constants).
- Low-level domain helper schemas/types that are implementation details.

## Determinism

The output is normalized and sorted, so unchanged input produces byte-identical snapshots across runs.

## Development

Run package tests:

```bash
bun run --cwd packages/build-graph test
```

Run typecheck:

```bash
bun run --cwd packages/build-graph typecheck
```
