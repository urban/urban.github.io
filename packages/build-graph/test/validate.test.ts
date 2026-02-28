import { NodeServices } from "@effect/platform-node"
import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Option, Result } from "effect"
import { discoverMarkdownFiles } from "../src/core/discover"
import {
  BuildGraphDuplicatePermalinkError,
  BuildGraphFrontmatterValidationError,
  validateDiscoveredMarkdownFiles,
} from "../src/core/validate"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-graph-validate-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("validates frontmatter and defaults published to true", async () => {
  const from = await makeTempDirectory()

  await writeFile(
    join(from, "note.md"),
    `---\npermalink: /note\ncreated: 2026-02-01\nupdated: 2026-02-02\n---\n# note\n`,
  )

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const discovered = yield* discoverMarkdownFiles(from)
      return yield* validateDiscoveredMarkdownFiles(discovered)
    }).pipe(Effect.provide(NodeServices.layer), Effect.result),
  )

  expect(Result.isSuccess(result)).toBeTrue()
  const validatedFiles = Option.getOrThrow(Result.getSuccess(result))
  expect(validatedFiles).toHaveLength(1)
  expect(validatedFiles[0].frontmatter.aliases).toEqual([])
  expect(validatedFiles[0].frontmatter.published).toBeTrue()
})

test("accepts semantically valid leap-day dates", async () => {
  const from = await makeTempDirectory()

  await writeFile(
    join(from, "note.md"),
    `---\npermalink: /note\ncreated: 2024-02-29\nupdated: 2024-03-01\n---\n# note\n`,
  )

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const discovered = yield* discoverMarkdownFiles(from)
      return yield* validateDiscoveredMarkdownFiles(discovered)
    }).pipe(Effect.provide(NodeServices.layer), Effect.result),
  )

  expect(Result.isSuccess(result)).toBeTrue()
  const validatedFiles = Option.getOrThrow(Result.getSuccess(result))
  expect(validatedFiles).toHaveLength(1)
  expect(validatedFiles[0].frontmatter.created).toBe("2024-02-29")
})

test("rejects semantically invalid calendar dates in YYYY-MM-DD form", async () => {
  const from = await makeTempDirectory()

  await writeFile(
    join(from, "invalid-date.md"),
    `---\npermalink: /invalid\ncreated: 2025-02-29\nupdated: 2026-02-30\n---\n# invalid\n`,
  )

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const discovered = yield* discoverMarkdownFiles(from)
      return yield* validateDiscoveredMarkdownFiles(discovered)
    }).pipe(Effect.provide(NodeServices.layer), Effect.result),
  )

  expect(Result.isFailure(result)).toBeTrue()
  const error = Option.getOrThrow(Result.getFailure(result))
  expect(error).toBeInstanceOf(BuildGraphFrontmatterValidationError)

  if (!(error instanceof BuildGraphFrontmatterValidationError)) {
    throw new Error("Expected BuildGraphFrontmatterValidationError")
  }

  expect(error.diagnostics).toHaveLength(1)
  expect(error.diagnostics[0]?.relativePath).toBe("invalid-date.md")
  expect(error.message).toContain("invalid-date.md")
})

test("aggregates frontmatter validation diagnostics across files", async () => {
  const from = await makeTempDirectory()

  await mkdir(join(from, "nested"), { recursive: true })
  await writeFile(
    join(from, "a-missing-permalink.md"),
    `---\ncreated: 2026-02-01\nupdated: 2026-02-02\n---\n# missing\n`,
  )
  await writeFile(
    join(from, "nested", "b-invalid-updated.md"),
    `---\npermalink: /valid\ncreated: 2026-02-01\nupdated: not-a-date\n---\n# invalid\n`,
  )

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const discovered = yield* discoverMarkdownFiles(from)
      return yield* validateDiscoveredMarkdownFiles(discovered)
    }).pipe(Effect.provide(NodeServices.layer), Effect.result),
  )

  expect(Result.isFailure(result)).toBeTrue()
  const error = Option.getOrThrow(Result.getFailure(result))
  expect(error).toBeInstanceOf(BuildGraphFrontmatterValidationError)

  if (!(error instanceof BuildGraphFrontmatterValidationError)) {
    throw new Error("Expected BuildGraphFrontmatterValidationError")
  }

  expect(error.diagnostics).toHaveLength(2)
  expect(error.diagnostics.map((diagnostic) => diagnostic.relativePath)).toEqual([
    "a-missing-permalink.md",
    "nested/b-invalid-updated.md",
  ])
  expect(error.message).toContain("a-missing-permalink.md")
  expect(error.message).toContain("nested/b-invalid-updated.md")
})

test("fails with duplicate permalink diagnostics", async () => {
  const from = await makeTempDirectory()

  await mkdir(join(from, "nested"), { recursive: true })
  await writeFile(
    join(from, "a.md"),
    `---\npermalink: /shared\ncreated: 2026-02-01\nupdated: 2026-02-02\n---\n# a\n`,
  )
  await writeFile(
    join(from, "nested", "b.md"),
    `---\npermalink: /shared\ncreated: 2026-02-03\nupdated: 2026-02-04\n---\n# b\n`,
  )

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const discovered = yield* discoverMarkdownFiles(from)
      return yield* validateDiscoveredMarkdownFiles(discovered)
    }).pipe(Effect.provide(NodeServices.layer), Effect.result),
  )

  expect(Result.isFailure(result)).toBeTrue()
  const error = Option.getOrThrow(Result.getFailure(result))
  expect(error).toBeInstanceOf(BuildGraphDuplicatePermalinkError)

  if (!(error instanceof BuildGraphDuplicatePermalinkError)) {
    throw new Error("Expected BuildGraphDuplicatePermalinkError")
  }

  expect(error.diagnostics).toEqual([
    {
      permalink: "/shared",
      relativePaths: ["a.md", "nested/b.md"],
    },
  ])
  expect(error.message).toContain("/shared")
  expect(error.message).toContain("a.md")
  expect(error.message).toContain("nested/b.md")
})
