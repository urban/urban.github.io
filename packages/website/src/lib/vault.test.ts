import { afterEach, expect, test } from "bun:test"
import { unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { Effect } from "effect"
import { RuntimeServer } from "./RuntimeServer"
import { Content } from "./services/Content"
import type { ContentService } from "./services/Content"
import { normalizeVaultSlug, resolveVaultDescription } from "./vault"

const vaultDir = join(process.cwd(), "content", "vault")
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
