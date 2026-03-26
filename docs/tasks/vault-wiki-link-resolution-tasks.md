---
name: vault-wiki-link-resolution
created: 2026-03-19
updated: 2026-03-19
source_plan: docs/plans/vault-wiki-link-resolution-plan.md
---

## Task Summary

- Parent plan: `docs/plans/vault-wiki-link-resolution-plan.md`
- Scope: Implement vault-only wiki-link lookup, source rewriting, content-pipeline integration, and regression coverage in `packages/website`.
- Tracking intent: Use these tracer-bullet tasks to land thin end-to-end slices in plan order while keeping each slice independently verifiable and traceable to the parent plan.

## Stream Groups

### Stream 1: Resolver and rewrite primitives

Objective: Establish the pure lookup and rewrite behavior for supported vault wiki-link syntax.

#### Task VWLR-001

- Title: Ship canonical-slug wiki-link rewrite happy path
- Status: Completed
- Blocked by: None
- Plan references:
  - `Stream 1: Resolver and rewrite primitives`
  - `Validation Checkpoints`
- What to build: Add a vault wiki-link utility that parses `[[target]]`, resolves canonical slug matches from published vault metadata, and rewrites them into escaped anchor HTML using the canonical vault route helper.
- Acceptance criteria:
  - A focused unit test proves `[[harness-loop]]` rewrites to an anchor pointing at the canonical `/vault/harness-loop` route with visible text from the target title.
  - The utility models parsed and resolved states with safe typed structures and no unsafe typing escapes.
- Notes:
  - Keep grammar intentionally narrow to supported v1 syntax only.

#### Task VWLR-002

- Title: Complete alias, custom-label, unresolved, and collision handling
- Status: Not started
- Blocked by: VWLR-001
- Plan references:
  - `Stream 1: Resolver and rewrite primitives`
  - `Dependency and Sequencing Strategy`
  - `Further Notes`
- What to build: Extend the utility so lookup construction supports alias tokens with canonical-slug precedence, unresolved references render muted spans, custom labels override visible text, and duplicate published aliases fail with an explicit collision error.
- Acceptance criteria:
  - Unit tests cover alias resolution, `[[target|Custom Label]]`, unresolved target rendering, unresolved custom-label rendering, multiple links in one block, and alias-collision failure naming both conflicting entries.
  - The unresolved span styling contract is encoded with existing website class conventions, or the task records `TODO: Confirm` if a dedicated class composition is still required.
- Notes:
  - Canonical slug must remain authoritative when a token matches both a slug and an alias.

### Stream 2: Vault content pipeline integration

Objective: Wire the resolver into vault loading only, without changing generic MDX behavior.

#### Task VWLR-003

- Title: Refactor vault loading into metadata-first preprocessing
- Status: Not started
- Blocked by: VWLR-002
- Plan references:
  - `Stream 2: Vault content pipeline integration`
  - `Dependency and Sequencing Strategy`
- What to build: Split `getVault()` into a metadata-first phase that decodes all vault entries before compilation, builds the published lookup once, and preprocesses each vault markdown source before `mdx.compile`.
- Acceptance criteria:
  - `getVault()` still returns the existing `VaultEntry` contract while reusing one published lookup per execution.
  - Non-vault compile paths remain unchanged because the preprocessing step is scoped to vault content only.
- Notes:
  - Keep vault-specific logic outside generic MDX service unless integration proves broader change is necessary.

#### Task VWLR-004

- Title: Preserve current vault discovery and published filtering behavior after integration
- Status: Not started
- Blocked by: VWLR-003
- Plan references:
  - `Stream 2: Vault content pipeline integration`
  - `Risks and Mitigations`
- What to build: Add or update content-service regression coverage proving the integration keeps current slug, title, description, metadata decode, and published filtering behavior while rewriting only vault sources.
- Acceptance criteria:
  - Tests show unpublished vault targets stay unresolved because only published entries participate in lookup construction.
  - Tests show existing vault discovery and published entry filtering behavior still match pre-feature expectations after the refactor.
- Notes:
  - Prefer semantic content-service assertions over implementation-detail tests.

### Stream 3: Regression and verification coverage

Objective: Prove rendered behavior and finish repo-wide verification.

#### Task VWLR-005

- Title: Verify rendered vault markup for resolved and unresolved links
- Status: Not started
- Blocked by: VWLR-004
- Plan references:
  - `Stream 3: Regression and verification coverage`
  - `Validation Checkpoints`
- What to build: Add integration-style tests around compiled vault content so rendered markup shows canonical vault route anchors for resolved links and muted inline spans for unresolved links across mixed inline content.
- Acceptance criteria:
  - Rendered markup assertions prove resolved links use canonical `/vault/{slug}` hrefs and unresolved references render spans with muted styling rather than raw wiki syntax.
  - Mixed-content cases with multiple wiki links in one markdown block each resolve independently.
- Notes:
  - Keep assertions semantic and route-focused.

#### Task VWLR-006

- Title: Run monorepo verification gates for the completed feature slice
- Status: Not started
- Blocked by: VWLR-005
- Plan references:
  - `Stream 3: Regression and verification coverage`
  - `Validation Checkpoints`
- What to build: Run required repo-root verification and capture any remaining blockers before marking the task set ready for implementation closeout.
- Acceptance criteria:
  - `bun run lint`, `bun run test`, and `bun run typecheck` complete from `/app`.
  - Any failing gate is recorded in tracking notes as a concrete blocker rather than silently ignored.
- Notes:
  - None.

## Dependency Map

- VWLR-001 -> None
- VWLR-002 -> VWLR-001
- VWLR-003 -> VWLR-002
- VWLR-004 -> VWLR-003
- VWLR-005 -> VWLR-004
- VWLR-006 -> VWLR-005

## Tracking Notes

- Active stream: Stream 1: Resolver and rewrite primitives
- Global blockers: None
- TODO: Confirm: Whether unresolved wiki-link spans can reuse an existing prose utility class combination or need a small dedicated class composition in emitted markup.
