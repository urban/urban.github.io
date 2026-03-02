---
"@urban/build-graph": major
---

Drop legacy v1 surface. Package now v2-only.

Breaking:

- remove v1-named compatibility exports/types from public API.
- `buildGraphSnapshot` no longer accepts caller-provided resolver index.
- no v1 code/test refs remain outside README migration/history docs.

Stable:

- CLI args/flow unchanged (`<from> <to>`).
- wikilink precedence unchanged (`path -> filename -> alias`).
- ambiguity hard-fail and unresolved diagnostics behavior unchanged.
