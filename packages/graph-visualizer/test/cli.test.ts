import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Exit, Option, Result } from "effect"
import { GraphVisualizerCliValidationError, runWithArgs } from "../src/cli/main"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "graph-visualizer-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("writes standalone graph html from snapshot file", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "artifacts", "graph.html")

  await writeFile(
    from,
    JSON.stringify({
      schemaVersion: "2",
      nodes: [
        {
          id: "notes/a.md",
          kind: "note",
          relativePath: "notes/a.md",
          permalink: "/a",
        },
      ],
      edges: [],
      diagnostics: [],
      indexes: {
        nodesById: {
          "notes/a.md": {
            id: "notes/a.md",
            kind: "note",
            relativePath: "notes/a.md",
            permalink: "/a",
          },
        },
        edgesBySourceNodeId: {},
        edgesByTargetNodeId: {},
      },
    }),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const html = await readFile(to, "utf8")
  expect(html).toContain("<!doctype html>")
  expect(html).toContain('id="graph-canvas"')
  expect(html).toContain('id="graph-snapshot"')
})

test("fails when from path does not exist", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const missingFrom = join(fromRoot, "missing.json")
  const to = join(toRoot, "docs", "graph.html")

  const result = await Effect.runPromiseExit(runWithArgs([missingFrom, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphVisualizerCliValidationError)
  if (!(firstError instanceof GraphVisualizerCliValidationError)) {
    throw new Error("Expected GraphVisualizerCliValidationError")
  }
  expect(firstError.message).toContain("Invalid from file")
})
