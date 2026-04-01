import { afterEach, expect, test } from "bun:test"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { DateTime, Effect } from "effect"
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

const contentDir = join(import.meta.dir, "..", "..", "content")
const vaultDir = join(contentDir, "vault")
const essaysDir = join(contentDir, "essays")
const createdPaths: string[] = []

afterEach(async () => {
  await Promise.all(
    createdPaths.splice(0, createdPaths.length).map(async (filepath) => {
      await rm(filepath, { force: true, recursive: true })
    }),
  )
})

const writeVaultFixture = async (filename: string, source: string): Promise<void> => {
  const filepath = join(vaultDir, filename)
  await writeFile(filepath, source, "utf8")
  createdPaths.push(filepath)
}

const writeEssayFixture = async (slug: string, source: string): Promise<void> => {
  const dirpath = join(essaysDir, slug)
  await mkdir(dirpath, { recursive: true })
  await writeFile(join(dirpath, "index.md"), source, "utf8")
  createdPaths.push(dirpath)
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
createdAt: 2026-03-01
updatedAt: 2026-03-01
aliases:
  - fixture alias
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
createdAt: 2026-03-01
updatedAt: 2026-03-01
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
  const publishedEntry = vault.find((entry) => entry.slug === "fixture-published")

  expect(vault.some((entry) => entry.slug === "fixture-published")).toBe(true)
  expect(vault.some((entry) => entry.slug === "fixture-draft")).toBe(true)
  expect(publishedVault.some((entry) => entry.slug === "fixture-published")).toBe(true)
  expect(publishedVault.some((entry) => entry.slug === "fixture-draft")).toBe(false)
  expect(publishedEntry?.data.title).toBe("Fixture Published")
  expect(publishedEntry?.data.permalink).toBe("fixture-published")
  expect(publishedEntry?.data.aliases).toEqual(["fixture alias"])
  expect(publishedEntry?.data.published).toBe(true)
  expect(
    publishedEntry?.data.createdAt !== undefined &&
      DateTime.formatIsoDateUtc(publishedEntry.data.createdAt),
  ).toBe("2026-03-01")
  expect(
    publishedEntry?.data.updatedAt !== undefined &&
      DateTime.formatIsoDateUtc(publishedEntry.data.updatedAt),
  ).toBe("2026-03-01")
  expect(publishedEntry?.data.description).toBe("First paragraph for the published fixture.")
})

test("content service keeps unpublished vault targets unresolved after preprocessing", async () => {
  await writeVaultFixture(
    "Fixture Hidden.md",
    `---
title: Fixture Hidden
permalink: fixture-hidden
createdAt: 2026-03-01
updatedAt: 2026-03-01
published: false
---

# Fixture Hidden

Hidden paragraph.
`,
  )
  await writeVaultFixture(
    "Fixture Source With Draft Link.md",
    `---
title: Fixture Source With Draft Link
permalink: fixture-source-with-draft-link
createdAt: 2026-03-01
updatedAt: 2026-03-01
published: true
---

See [[fixture-hidden|Hidden Draft]].
`,
  )

  const program = Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.findPublishedVaultBySlug("fixture-source-with-draft-link")
  })
  const entry = await RuntimeServer.runPromise(program)

  expect(entry).toBeDefined()

  if (entry === undefined) {
    throw new Error("Missing fixture-source-with-draft-link vault entry")
  }

  const markup = renderToStaticMarkup(createElement(entry.Content))
  expect(markup).toContain(
    `<p>See <span class="${UNRESOLVED_VAULT_WIKI_LINK_CLASS}">Hidden Draft</span>.</p>`,
  )
})

test("content service preprocesses vault wiki-links before vault mdx compile", async () => {
  await writeVaultFixture(
    "Fixture Target.md",
    `---
title: Fixture Target
permalink: fixture-target
createdAt: 2026-03-01
updatedAt: 2026-03-01
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
createdAt: 2026-03-01
updatedAt: 2026-03-01
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
  expect(markup).toContain(
    '<p>See <a class="styled-link" href="/vault/fixture-target"><span>Fixture Target</span></a>.</p>',
  )
})

test("content service renders resolved and unresolved vault wiki-links across mixed inline content", async () => {
  await writeVaultFixture(
    "Fixture Target Alpha.md",
    `---
title: Fixture Target Alpha
permalink: fixture-target-alpha
createdAt: 2026-03-01
updatedAt: 2026-03-01
published: true
---

# Fixture Target Alpha

Alpha paragraph.
`,
  )
  await writeVaultFixture(
    "Fixture Target Beta.md",
    `---
title: Fixture Target Beta
permalink: fixture-target-beta
createdAt: 2026-03-01
updatedAt: 2026-03-01
published: true
---

# Fixture Target Beta

Beta paragraph.
`,
  )
  await writeVaultFixture(
    "Fixture Mixed Source.md",
    `---
title: Fixture Mixed Source
permalink: fixture-mixed-source
createdAt: 2026-03-01
updatedAt: 2026-03-01
published: true
---

Start [[fixture-target-alpha]], continue with [[fixture-target-beta|Beta Label]], and end on [[missing-target|Missing Target]].
`,
  )

  const program = Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.findPublishedVaultBySlug("fixture-mixed-source")
  })
  const entry = await RuntimeServer.runPromise(program)

  expect(entry).toBeDefined()

  if (entry === undefined) {
    throw new Error("Missing fixture-mixed-source vault entry")
  }

  const markup = renderToStaticMarkup(createElement(entry.Content))

  expect(markup).toContain(
    `<p>Start <a class="styled-link" href="/vault/fixture-target-alpha"><span>Fixture Target Alpha</span></a>, continue with <a class="styled-link" href="/vault/fixture-target-beta"><span>Beta Label</span></a>, and end on <span class="${UNRESOLVED_VAULT_WIKI_LINK_CLASS}">Missing Target</span>.</p>`,
  )
  expect(markup).not.toContain("[[")
})

test("content service leaves non-vault collections on the existing mdx path", async () => {
  await writeEssayFixture(
    "fixture-article-wiki-link",
    `---
title: Fixture Essay Wiki Link
description: Essay fixture for wiki-link regression.
createdAt: "2026-03-01"
updatedAt: "2026-03-01"
---

See [[fixture-target]].
`,
  )

  const program = Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.getEssays()
  })
  const essays = await RuntimeServer.runPromise(program)
  const entry = essays.find(({ slug }) => slug === "fixture-article-wiki-link")

  expect(entry).toBeDefined()

  if (entry === undefined) {
    throw new Error("Missing fixture-article-wiki-link essay entry")
  }

  expect(entry.source).toContain("[[fixture-target]]")
  expect(renderToStaticMarkup(createElement(entry.Content))).toContain(
    "<p>See [[fixture-target]].</p>",
  )
})

test("content service fails on invalid vault frontmatter", async () => {
  await writeVaultFixture(
    "Fixture Invalid.md",
    `---
title: Fixture Invalid
permalink: /
createdAt: 2026-03-01
updatedAt: 2026-03-01
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
