import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Exit, Option, Result } from "effect"
import { GraphViewCliValidationError, runWithArgs } from "../src/cli/main"
import { makeGraphSnapshot } from "./fixtures"

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
      makeGraphSnapshot({
        nodes: [
          {
            id: "/vault/z",
            kind: "note",
            relativePath: "notes/z.md",
            sourceRelativePath: "notes/z.md",
            permalink: "/z",
            slug: "z",
            routePath: "/vault/z",
            label: "Z Label",
          },
          {
            id: "/vault/a",
            kind: "note",
            relativePath: "notes/a.md",
            sourceRelativePath: "notes/a.md",
            permalink: "/a",
            slug: "a",
            routePath: "/vault/a",
            label: "A Label",
            title: "A Title",
          },
        ],
        edges: [
          {
            sourceNodeId: "/vault/a",
            targetNodeId: "/vault/z",
            sourceRelativePath: "notes/a.md",
            rawWikilink: "[[z|Z]]",
            target: "z",
            displayText: "Z",
            resolutionStrategy: "path",
          },
        ],
      }),
      null,
      2,
    ),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const markdown = await readFile(to, "utf8")
  expect(markdown).toBe(
    '## Graph\n\n```mermaid\ngraph LR\n  n0["A Title"]\n  n1["Z Label"]\n  n0 --> n1\n```\n',
  )
})

test("writes canonical-route snapshot markdown with route-aware note labels", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "docs", "graph.md")

  await writeFile(
    from,
    JSON.stringify(
      makeGraphSnapshot({
        nodes: [
          {
            id: "/vault/harness-loop",
            kind: "note",
            relativePath: "Harness Loop.md",
            sourceRelativePath: "Harness Loop.md",
            permalink: "/harness-loop",
            slug: "harness-loop",
            routePath: "/vault/harness-loop",
            label: "Harness Loop",
            title: "Harness Loop Title",
            created: "2026-02-01",
            updated: "2026-02-02",
            published: true,
          },
          {
            id: "/vault/tool-adapter-contract",
            kind: "note",
            relativePath: "Tool Adapter Contract.md",
            sourceRelativePath: "Tool Adapter Contract.md",
            permalink: "/tool-adapter-contract",
            slug: "tool-adapter-contract",
            routePath: "/vault/tool-adapter-contract",
            label: "Tool Adapter Contract",
            created: "2026-02-03",
            updated: "2026-02-04",
            published: true,
          },
          {
            id: "placeholder:missing-route",
            kind: "placeholder",
            unresolvedTarget: "missing-route",
          },
        ],
        edges: [
          {
            sourceNodeId: "/vault/harness-loop",
            targetNodeId: "/vault/tool-adapter-contract",
            sourceRelativePath: "Harness Loop.md",
            rawWikilink: "[[tool-adapter-contract]]",
            target: "tool-adapter-contract",
            resolutionStrategy: "path",
          },
          {
            sourceNodeId: "/vault/harness-loop",
            targetNodeId: "placeholder:missing-route",
            sourceRelativePath: "Harness Loop.md",
            rawWikilink: "[[missing-route]]",
            target: "missing-route",
            resolutionStrategy: "unresolved",
          },
        ],
        diagnostics: [
          {
            type: "unresolved-wikilink",
            sourceRelativePath: "Harness Loop.md",
            rawWikilink: "[[missing-route]]",
            target: "missing-route",
            placeholderNodeId: "placeholder:missing-route",
          },
        ],
      }),
      null,
      2,
    ),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const markdown = await readFile(to, "utf8")
  expect(markdown).toBe(
    '## Graph\n\n```mermaid\ngraph LR\n  n0["Harness Loop Title"]\n  n1["Tool Adapter Contract"]\n  n2["unresolved:missing-route"]\n  n0 --> n1\n  n0 --> n2\n  classDef unresolved fill:#fff4e5,stroke:#d97706,color:#7c2d12,stroke-width:1px\n  class n2 unresolved\n```\n',
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
      schemaVersion: "2",
      nodes: [],
      edges: [],
      diagnostics: [],
      indexes: {},
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

  await writeFile(from, JSON.stringify(makeGraphSnapshot({ nodes: [] })))

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
  await writeFile(from, JSON.stringify(makeGraphSnapshot({ nodes: [] })))

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
