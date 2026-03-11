---
name: build-graph-vault-route-plan
created: 2026-03-11
updated: 2026-03-11
---

## Execution Summary

Add route-aware first-class note support to `@urban/build-graph` so vault-route consumers can build snapshots from Markdown notes whose source filenames differ from canonical route slugs, while deriving prefixed route paths such as `/vault/harness-loop` from frontmatter `permalink: harness-loop` plus build configuration.

## Scope Alignment

- User Stories: `docs/specs/build-graph-vault-route/user-stories.md`
- Requirements: `docs/specs/build-graph-vault-route/requirements.md`
- Technical Design: `docs/specs/build-graph-vault-route/technical-design.md`
- In-scope implementation objective: extend `@urban/build-graph` with route-aware validation, canonical route identity, metadata-rich snapshot output, route-aware indexes, source provenance, and curated public build helpers aligned to vault-route.

## Implementation Streams

### Route-Aware Validation

- Objective: introduce route-aware note identity and permalink-prefix handling without breaking existing validation flows.
- Implements:
  - `FR1.1`
  - `FR1.2`
  - `FR1.3`
  - `FR1.4`
  - `FR1.5`
  - `TC3.3`
  - `TC3.4`
- Notes: preserve a bounded migration path for current source-path consumers while adding canonical route identity for vault-route callers.

### Snapshot Contract Upgrade

- Objective: emit route-aware note nodes, metadata, provenance, and lookup indexes that remove downstream vault-route projection code.
- Implements:
  - `FR1.6`
  - `FR1.7`
  - `FR1.8`
  - `FR1.9`
  - `FR1.10`
  - `FR1.12`
  - `DR4.2`
  - `DR4.3`
  - `DR4.4`
  - `DR4.5`
- Notes: this stream owns schema-version changes, migration notes, and consumer-facing contract clarity.

### Public API and Tooling

- Objective: expose supported programmatic helpers so website SSG code can build route-aware snapshots without duplicating discovery and orchestration logic.
- Implements:
  - `FR1.11`
  - `IR5.2`
  - `IR5.4`
  - `NFR2.2`
  - `NFR2.3`
- Notes: CLI and library API should converge on one route-aware build contract rather than separate code paths.

### Consumer Compatibility

- Objective: keep legacy callers stable while documenting the migration path for graph consumers that adopt the richer route-aware snapshot contract.
- Implements:
  - `NFR2.1`
  - `NFR2.2`
  - `NFR2.4`
  - `NFR2.5`
  - `SC7.6`
- Notes: validate both source-path and canonical-route identity flows in tests before considering the work complete.

## Work Breakdown

### Route-Aware Validation

- [ ] Add route-aware build options and canonical route normalization helpers, including deterministic prefix normalization.
- [ ] Extend validated note types to carry source provenance plus canonical slug and route path.
- [ ] Validate route-aware `permalink` values as kebab-case slug segments and reject slash-containing or non-normalized values.
- [ ] Add duplicate detection for canonical slug and canonical route path collisions.

### Snapshot Contract Upgrade

- [ ] Extend snapshot note-node schema with slug, route path, source provenance, title or label, dates, aliases, published, and optional description-compatible summary data.
- [ ] Define route-aware node-id strategy and thread it through build and normalization flows.
- [ ] Add route-aware indexes such as `noteNodeIdBySlug` and `noteNodeIdByRoutePath`.
- [ ] Preserve source provenance in unresolved and ambiguous diagnostics after route normalization.
- [ ] Update serialization, schema versioning, README examples, and migration guidance for the new contract.

### Public API and Tooling

- [ ] Export discovery helpers on the curated public API or equivalent supported facade.
- [ ] Add a high-level route-aware build helper that performs discovery, loading, validation, wikilink parsing, and snapshot generation.
- [ ] Ensure CLI route-aware execution reuses the same build contract and option normalization logic as the library API.
- [ ] Add public API tests covering the new helpers and route-aware option flow.

### Consumer Compatibility

- [ ] Add regression tests for legacy source-path identity behavior.
- [ ] Add route-aware tests for notes like `Harness Loop.md` with `permalink: harness-loop` and prefix `/vault`.
- [ ] Verify downstream snapshot consumers can map by slug or route path without synthetic filename projection.
- [ ] Document the migration path for consumers that currently depend on `node.id === relativePath`.

## Dependency and Sequencing Strategy

- Prerequisites: existing `@urban/build-graph` validation/build pipeline, current graph consumers, and downstream vault-route requirements.
- Sequencing notes: land route-aware validation primitives first, then upgrade the snapshot contract, then expose the public facade and CLI wiring, and finish with migration/docs updates plus compatibility tests.
- Coordination risks: schema/version work can break downstream packages if landed without migration notes and fixture updates; keep consumer contract changes explicit and staged.

## Validation Checkpoints

- `bash .agents/skills/write-requirements/scripts/validate_requirements.sh docs/specs/build-graph-vault-route/requirements.md`
- `bash .agents/skills/write-technical-design/scripts/validate_technical_design.sh docs/specs/build-graph-vault-route/technical-design.md`
- `bash .agents/skills/execution-planning/scripts/validate_plan.sh docs/plans/build-graph-vault-route-plan.md`
- `bash .agents/skills/write-user-stories/scripts/validate_story.sh 'As a website integrator, I want @urban/build-graph to expose canonical route identity for each note, so that /vault/[slug] pages can map directly to graph nodes without projecting synthetic filenames first.'`
- `bun --filter @urban/build-graph test`
- `bun --filter @urban/build-graph typecheck`
- Targeted tests for route-aware permalink validation, prefix normalization, metadata-rich note nodes, route-aware indexes, and diagnostic provenance.

## Risks and Mitigations

- Risk: route-aware schema changes break consumers that assume `node.id === relativePath`.
- Mitigation: preserve a legacy path, version the schema explicitly, and document migration steps with updated fixtures.
- Risk: build-graph grows into an unbounded content-model package.
- Mitigation: limit added metadata to fields directly needed for route-aware graph consumers and keep rendering concerns out of scope.
- Risk: route-prefix and permalink normalization rules drift between CLI and public API.
- Mitigation: centralize normalization in one route-aware build options module used by both entry points.

## Progress Tracking

- Status: Not started
- Active stream: Route-Aware Validation
- Notes: Spec pack authored on 2026-03-11. Implementation should begin with canonical route identity and prefix normalization because downstream snapshot and API work depend on that contract.

## Further Notes

Shared acceptance focus:

- route-aware builds accept source files like `Harness Loop.md` while deriving canonical slug `harness-loop`
- configured prefix `/vault` yields canonical route path `/vault/harness-loop`
- snapshot note nodes expose first-class route identity, metadata, and provenance
- route-aware indexes let downstream consumers select by slug or route path directly
- consumers can use a supported library helper instead of reimplementing discovery plus orchestration
- legacy source-path consumers have explicit migration guidance rather than silent breakage
