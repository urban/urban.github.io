import { NodeServices } from "@effect/platform-node"
import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Option, Result } from "effect"
import { discoverMarkdownFiles } from "../src/core/discover"
import {
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
