import { afterEach, expect, test } from "bun:test"
import { unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { Effect } from "effect"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { RuntimeServer } from "./RuntimeServer"
import { Content } from "./services/Content"
import type { ContentService } from "./services/Content"
import {
  buildPublishedVaultWikiLinkLookup,
  normalizeVaultSlug,
  resolveVaultDescription,
  rewriteVaultWikiLinksToHtml,
  UNRESOLVED_VAULT_WIKI_LINK_CLASS,
  VaultWikiLinkAliasCollisionError,
} from "./vault"

const vaultDir = join(import.meta.dir, "..", "..", "content", "vault")
const createdFiles: string[] = []

afterEach(async () => {
  await Promise.all(
    createdFiles.splice(0, createdFiles.length).map(async (filepath) => {
      await unlink(filepath)
    }),
  )
})

const writeVaultFixture = async (filename: string, source: string): Promise<void> => {
  const filepath = join(vaultDir, filename)
  await writeFile(filepath, source, "utf8")
  createdFiles.push(filepath)
}

test("normalizes canonical vault slugs and rejects blank-root permalinks", () => {
  expect(normalizeVaultSlug("/harness-loop/")).toBe("harness-loop")
  expect(normalizeVaultSlug("/")).toBeUndefined()
})

test("prefers explicit vault description over derived excerpt", () => {
  expect(resolveVaultDescription("Explicit", "Derived")).toBe("Explicit")
  expect(resolveVaultDescription(undefined, "Derived")).toBe("Derived")
})

test("rewrites canonical vault wiki-links to canonical vault route anchors", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([
    {
      slug: "harness-loop",
      title: "Harness Loop",
      aliases: ["harness loop"],
    },
  ])

  expect(rewriteVaultWikiLinksToHtml("See [[harness-loop]] next.", lookup)).toBe(
    'See <a href="/vault/harness-loop">Harness Loop</a> next.',
  )
})

test("resolves published vault aliases to canonical vault routes", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([
    {
      slug: "ai-harness-learning",
      title: "AI Harness Learning",
      aliases: ["vault index"],
    },
  ])

  expect(rewriteVaultWikiLinksToHtml("Start at [[vault index]].", lookup)).toBe(
    'Start at <a href="/vault/ai-harness-learning">AI Harness Learning</a>.',
  )
})

test("uses custom labels while keeping canonical vault hrefs", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([
    {
      slug: "trace-and-replay",
      title: "Trace And Replay",
      aliases: ["trace replay"],
    },
  ])

  expect(rewriteVaultWikiLinksToHtml("Read [[trace replay|Replay Traces]].", lookup)).toBe(
    'Read <a href="/vault/trace-and-replay">Replay Traces</a>.',
  )
})

test("renders unresolved vault wiki-links as muted spans", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([])

  expect(rewriteVaultWikiLinksToHtml("Missing [[missing-note]] here.", lookup)).toBe(
    `Missing <span class="${UNRESOLVED_VAULT_WIKI_LINK_CLASS}">missing-note</span> here.`,
  )
})

test("renders unresolved custom labels as muted spans", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([])

  expect(rewriteVaultWikiLinksToHtml("Missing [[missing-note|Missing Note]] here.", lookup)).toBe(
    `Missing <span class="${UNRESOLVED_VAULT_WIKI_LINK_CLASS}">Missing Note</span> here.`,
  )
})

test("rewrites multiple vault wiki-links in one block independently", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([
    {
      slug: "harness-loop",
      title: "Harness Loop",
      aliases: ["harness loop"],
    },
    {
      slug: "trace-and-replay",
      title: "Trace And Replay",
      aliases: ["trace replay"],
    },
  ])

  expect(
    rewriteVaultWikiLinksToHtml(
      "See [[harness loop]], [[trace-and-replay|Replay]], and [[missing-note]].",
      lookup,
    ),
  ).toBe(
    `See <a href="/vault/harness-loop">Harness Loop</a>, <a href="/vault/trace-and-replay">Replay</a>, and <span class="${UNRESOLVED_VAULT_WIKI_LINK_CLASS}">missing-note</span>.`,
  )
})

test("prefers canonical slugs over alias matches for the same token", () => {
  const lookup = buildPublishedVaultWikiLinkLookup([
    {
      slug: "harness-loop",
      title: "Harness Loop",
      aliases: [],
    },
    {
      slug: "other-entry",
      title: "Other Entry",
      aliases: ["harness-loop"],
    },
  ])

  expect(rewriteVaultWikiLinksToHtml("See [[harness-loop]].", lookup)).toBe(
    'See <a href="/vault/harness-loop">Harness Loop</a>.',
  )
})

test("fails fast on published vault alias collisions and names both entries", () => {
  expect(() =>
    buildPublishedVaultWikiLinkLookup([
      {
        slug: "alpha",
        title: "Alpha",
        aliases: ["shared alias"],
      },
      {
        slug: "beta",
        title: "Beta",
        aliases: ["shared alias"],
      },
    ]),
  ).toThrow(
    new VaultWikiLinkAliasCollisionError({
      alias: "shared alias",
      first: {
        slug: "alpha",
        title: "Alpha",
        aliases: ["shared alias"],
      },
      second: {
        slug: "beta",
        title: "Beta",
        aliases: ["shared alias"],
      },
    }).message,
  )
})

test("content service discovers published vault fixtures and excludes unpublished ones", async () => {
  await writeVaultFixture(
    "Fixture Published.md",
    `---
title: Fixture Published
permalink: fixture-published
created: 2026-03-01
updated: 2026-03-01
published: true
---

# Fixture Published

First paragraph for the published fixture.
`,
  )
  await writeVaultFixture(
    "Fixture Draft.md",
    `---
title: Fixture Draft
permalink: fixture-draft
created: 2026-03-01
updated: 2026-03-01
published: false
---

# Fixture Draft

First paragraph for the unpublished fixture.
`,
  )

  const program = Effect.gen(function* () {
    const content: ContentService = yield* Content
    const vault = yield* content.getVault()
    const publishedVault = yield* content.getPublishedVault()
    return { vault, publishedVault }
  })
  const { vault, publishedVault } = await RuntimeServer.runPromise(program)

  expect(vault.some((entry) => entry.slug === "fixture-published")).toBe(true)
  expect(vault.some((entry) => entry.slug === "fixture-draft")).toBe(true)
  expect(publishedVault.some((entry) => entry.slug === "fixture-published")).toBe(true)
  expect(publishedVault.some((entry) => entry.slug === "fixture-draft")).toBe(false)
  expect(publishedVault.find((entry) => entry.slug === "fixture-published")?.data.description).toBe(
    "First paragraph for the published fixture.",
  )
})

test("content service preprocesses vault wiki-links before vault mdx compile", async () => {
  await writeVaultFixture(
    "Fixture Target.md",
    `---
title: Fixture Target
permalink: fixture-target
created: 2026-03-01
updated: 2026-03-01
published: true
---

# Fixture Target

Target paragraph.
`,
  )
  await writeVaultFixture(
    "Fixture Source.md",
    `---
title: Fixture Source
permalink: fixture-source
created: 2026-03-01
updated: 2026-03-01
published: true
---

See [[fixture-target]].
`,
  )

  const program = Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.findPublishedVaultBySlug("fixture-source")
  })
  const entry = await RuntimeServer.runPromise(program)

  expect(entry).toBeDefined()

  if (entry === undefined) {
    throw new Error("Missing fixture-source vault entry")
  }

  expect(entry.source).toContain("[[fixture-target]]")

  const markup = renderToStaticMarkup(createElement(entry.Content))
  expect(markup).toContain('<p>See <a href="/vault/fixture-target">Fixture Target</a>.</p>')
})

test("content service fails on invalid vault frontmatter", async () => {
  await writeVaultFixture(
    "Fixture Invalid.md",
    `---
title: Fixture Invalid
permalink: /
created: 2026-03-01
updated: 2026-03-01
published: true
---

# Fixture Invalid

Broken permalink fixture.
`,
  )

  const program = Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.getVault()
  })

  await expect(RuntimeServer.runPromise(program)).rejects.toBeDefined()
})
