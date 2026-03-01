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

Example unresolved placeholder node id:

- `placeholder:missing/note`

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
