import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Exit, Option, Result } from "effect"
import { GraphViewCliValidationError, runWithArgs } from "../src/cli/main"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "graph-view-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("writes graph markdown with note nodes and unlabeled edges from a snapshot file", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "docs", "graph.md")

  await writeFile(
    from,
    JSON.stringify(
      {
        schemaVersion: "2",
        nodes: [
          {
            id: "notes/z.md",
            kind: "note",
            relativePath: "notes/z.md",
            permalink: "/z",
          },
          {
            id: "notes/a.md",
            kind: "note",
            relativePath: "notes/a.md",
            permalink: "/a",
          },
        ],
        edges: [
          {
            sourceNodeId: "notes/a.md",
            targetNodeId: "notes/z.md",
            sourceRelativePath: "notes/a.md",
            rawWikilink: "[[z|Z]]",
            target: "z",
            displayText: "Z",
            resolutionStrategy: "path",
          },
        ],
        diagnostics: [],
        indexes: {
          nodesById: {
            "notes/a.md": {
              id: "notes/a.md",
              kind: "note",
              relativePath: "notes/a.md",
              permalink: "/a",
            },
            "notes/z.md": {
              id: "notes/z.md",
              kind: "note",
              relativePath: "notes/z.md",
              permalink: "/z",
            },
          },
          edgesBySourceNodeId: {
            "notes/a.md": [
              {
                sourceNodeId: "notes/a.md",
                targetNodeId: "notes/z.md",
                sourceRelativePath: "notes/a.md",
                rawWikilink: "[[z|Z]]",
                target: "z",
                displayText: "Z",
                resolutionStrategy: "path",
              },
            ],
          },
          edgesByTargetNodeId: {
            "notes/z.md": [
              {
                sourceNodeId: "notes/a.md",
                targetNodeId: "notes/z.md",
                sourceRelativePath: "notes/a.md",
                rawWikilink: "[[z|Z]]",
                target: "z",
                displayText: "Z",
                resolutionStrategy: "path",
              },
            ],
          },
        },
      },
      null,
      2,
    ),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const markdown = await readFile(to, "utf8")
  expect(markdown).toBe(
    '## Graph\n\n```mermaid\ngraph LR\n  0["notes/a.md"]\n  1["notes/z.md"]\n  0 --- 1\n```\n',
  )
})

test("fails when snapshot file contains invalid JSON", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "docs", "graph.md")

  await writeFile(from, "{ invalid")

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()
})

test("fails when snapshot file JSON does not match graph snapshot schema", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "docs", "graph.md")

  await writeFile(
    from,
    JSON.stringify({
      nodes: [],
      edges: [],
    }),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()
})

test("fails when from path does not exist", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const missingFrom = join(fromRoot, "missing.json")
  const to = join(toRoot, "docs", "graph.md")

  const result = await Effect.runPromiseExit(runWithArgs([missingFrom, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewCliValidationError)
  if (!(firstError instanceof GraphViewCliValidationError)) {
    throw new Error("Expected GraphViewCliValidationError")
  }
  expect(firstError.message).toContain("Invalid from file")
})

test("fails when from path is a directory", async () => {
  const from = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const to = join(toRoot, "docs", "graph.md")

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewCliValidationError)
  if (!(firstError instanceof GraphViewCliValidationError)) {
    throw new Error("Expected GraphViewCliValidationError")
  }
  expect(firstError.message).toContain("is not a file")
})

test("fails when to path exists as a directory", async () => {
  const fromRoot = await makeTempDirectory()
  const to = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")

  await writeFile(
    from,
    JSON.stringify({
      nodes: [],
      edges: [],
      diagnostics: [],
    }),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewCliValidationError)
  if (!(firstError instanceof GraphViewCliValidationError)) {
    throw new Error("Expected GraphViewCliValidationError")
  }
  expect(firstError.message).toContain("Invalid to output file")
})

test("fails when output parent path is a file", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const parentFile = join(toRoot, "blocked")
  const to = join(parentFile, "graph.md")

  await writeFile(parentFile, "not a directory")
  await writeFile(
    from,
    JSON.stringify({
      nodes: [],
      edges: [],
      diagnostics: [],
    }),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewCliValidationError)
  if (!(firstError instanceof GraphViewCliValidationError)) {
    throw new Error("Expected GraphViewCliValidationError")
  }
  expect(firstError.message).toContain("Invalid to output directory")
})
