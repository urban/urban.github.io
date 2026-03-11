import { expect, test } from "bun:test"
import { Effect, Option, Result } from "effect"
import {
  BuildGraphDuplicatePermalinkError,
  BuildGraphFrontmatterValidationError,
  validateMarkdownSources,
  type MarkdownSourceFile,
} from "../src/core/validate"

const sourceFile = (relativePath: string, source: string): MarkdownSourceFile => ({
  relativePath,
  source,
})

test("validates frontmatter and defaults published to true", async () => {
  const result = await Effect.runPromise(
    validateMarkdownSources([
      sourceFile(
        "note.md",
        `---\npermalink: /note\ncreated: 2026-02-01\nupdated: 2026-02-02\n---\n# note\n`,
      ),
    ]).pipe(Effect.result),
  )

  expect(Result.isSuccess(result)).toBeTrue()
  const validatedFiles = Option.getOrThrow(Result.getSuccess(result))
  expect(validatedFiles).toHaveLength(1)
  expect(validatedFiles[0].frontmatter.aliases).toEqual([])
  expect(validatedFiles[0].frontmatter.published).toBeTrue()
  expect(validatedFiles[0].slug).toBe("note")
  expect(validatedFiles[0].routePath).toBe("/note")
  expect(validatedFiles[0].nodeId).toBe("note.md")
})

test("accepts semantically valid leap-day dates", async () => {
  const result = await Effect.runPromise(
    validateMarkdownSources([
      sourceFile(
        "note.md",
        `---\npermalink: /note\ncreated: 2024-02-29\nupdated: 2024-03-01\n---\n# note\n`,
      ),
    ]).pipe(Effect.result),
  )

  expect(Result.isSuccess(result)).toBeTrue()
  const validatedFiles = Option.getOrThrow(Result.getSuccess(result))
  expect(validatedFiles).toHaveLength(1)
  expect(validatedFiles[0].frontmatter.created).toBe("2024-02-29")
})

test("rejects semantically invalid calendar dates in YYYY-MM-DD form", async () => {
  const result = await Effect.runPromise(
    validateMarkdownSources([
      sourceFile(
        "invalid-date.md",
        `---\npermalink: /invalid\ncreated: 2025-02-29\nupdated: 2026-02-30\n---\n# invalid\n`,
      ),
    ]).pipe(Effect.result),
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
  const result = await Effect.runPromise(
    validateMarkdownSources([
      sourceFile(
        "a-missing-permalink.md",
        `---\ncreated: 2026-02-01\nupdated: 2026-02-02\n---\n# missing\n`,
      ),
      sourceFile(
        "nested/b-invalid-updated.md",
        `---\npermalink: /valid\ncreated: 2026-02-01\nupdated: not-a-date\n---\n# invalid\n`,
      ),
    ]).pipe(Effect.result),
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
  const result = await Effect.runPromise(
    validateMarkdownSources([
      sourceFile(
        "a.md",
        `---\npermalink: /shared\ncreated: 2026-02-01\nupdated: 2026-02-02\n---\n# a\n`,
      ),
      sourceFile(
        "nested/b.md",
        `---\npermalink: /shared\ncreated: 2026-02-03\nupdated: 2026-02-04\n---\n# b\n`,
      ),
    ]).pipe(Effect.result),
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

test("supports canonical-route mode for spaced source filenames with prefixed route paths", async () => {
  const result = await Effect.runPromise(
    validateMarkdownSources(
      [
        sourceFile(
          "Harness Loop.md",
          [
            "---",
            "title: Harness Loop",
            "permalink: harness-loop",
            "created: 2026-02-01",
            "updated: 2026-02-02",
            "---",
            "# note",
            "",
          ].join("\n"),
        ),
      ],
      { identityStrategy: "canonical-route", routePrefix: "/vault/" },
    ).pipe(Effect.result),
  )

  expect(Result.isSuccess(result)).toBeTrue()
  const validatedFiles = Option.getOrThrow(Result.getSuccess(result))
  expect(validatedFiles[0]).toMatchObject({
    relativePath: "Harness Loop.md",
    sourceRelativePath: "Harness Loop.md",
    slug: "harness-loop",
    routePath: "/vault/harness-loop",
    nodeId: "/vault/harness-loop",
    label: "Harness Loop",
  })
})

test("humanizes canonical-route labels when title is absent", async () => {
  const result = await Effect.runPromise(
    validateMarkdownSources(
      [
        sourceFile(
          "Harness Loop.md",
          [
            "---",
            "permalink: harness-loop",
            "created: 2026-02-01",
            "updated: 2026-02-02",
            "---",
            "# note",
            "",
          ].join("\n"),
        ),
      ],
      { identityStrategy: "canonical-route" },
    ).pipe(Effect.result),
  )

  expect(Result.isSuccess(result)).toBeTrue()
  const validatedFiles = Option.getOrThrow(Result.getSuccess(result))
  expect(validatedFiles[0]).toMatchObject({
    relativePath: "Harness Loop.md",
    slug: "harness-loop",
    routePath: "/harness-loop",
    nodeId: "/harness-loop",
    label: "Harness Loop",
  })
})

test("rejects non-kebab permalink values in canonical-route mode", async () => {
  const result = await Effect.runPromise(
    validateMarkdownSources(
      [
        sourceFile(
          "Harness Loop.md",
          [
            "---",
            "permalink: /vault/Harness Loop",
            "created: 2026-02-01",
            "updated: 2026-02-02",
            "---",
            "# note",
            "",
          ].join("\n"),
        ),
      ],
      { identityStrategy: "canonical-route", routePrefix: "/vault" },
    ).pipe(Effect.result),
  )

  expect(Result.isFailure(result)).toBeTrue()
  const error = Option.getOrThrow(Result.getFailure(result))
  expect(error).toBeInstanceOf(BuildGraphFrontmatterValidationError)
  if (!(error instanceof BuildGraphFrontmatterValidationError)) {
    throw new Error("Expected BuildGraphFrontmatterValidationError")
  }

  expect(error.message).toContain("Invalid canonical permalink slug")
})
