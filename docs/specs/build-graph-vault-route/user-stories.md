---
name: build-graph-vault-route
created: 2026-03-11
updated: 2026-03-11
---

## User Stories

1. As a website integrator, I want `@urban/build-graph` to expose canonical route identity for each note, so that `/vault/[slug]` pages can map directly to graph nodes without projecting synthetic filenames first.
2. As a site maintainer, I want note frontmatter `permalink` values to use deterministic kebab-case slug segments such as `harness-loop`, so that notes with filesystem names like `Harness Loop.md` still produce stable route-aware graph output.
3. As a website integrator, I want `@urban/build-graph` to support a configured route prefix such as `/vault`, so that snapshot route paths and route indexes align with the final website URL space without duplicating prefix logic downstream.
4. As a graph consumer, I want snapshot note nodes to include display and publication metadata, so that graph-driven labels, listings, and selection UI can render from one library contract instead of a parallel website model.
5. As a library consumer, I want programmatic discovery and build helpers on the curated public API, so that I can build a route-aware snapshot from a markdown corpus without reimplementing file discovery and orchestration code.

## Further Notes

- Assumptions: vault notes remain Markdown files; frontmatter continues to include one `permalink` field per note; route-aware output must remain deterministic for unchanged input.
- Open questions: None.
- Decision: `permalink` is treated as a canonical slug segment for route identity in the vault-route flow, while route prefixes are supplied by build configuration rather than embedded into every source note.
