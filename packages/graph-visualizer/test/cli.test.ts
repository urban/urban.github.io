import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NodeServices } from "@effect/platform-node"
import { Effect, Exit, Option, Result } from "effect"
import { GraphVisualizerModelIntegrityError } from "../src/core/model"
import {
  ensureArtifactSizeWithinLimit,
  GraphVisualizerArtifactTooLargeError,
  GraphVisualizerCliValidationError,
  runGraphVisualizer,
  runWithArgs,
} from "../src/cli/main"

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

test("fails when snapshot has edge endpoint integrity error", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "docs", "graph.html")

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
      edges: [
        {
          sourceNodeId: "notes/a.md",
          targetNodeId: "notes/missing.md",
          sourceRelativePath: "notes/a.md",
          rawWikilink: "[[missing]]",
          target: "missing",
          resolutionStrategy: "unresolved",
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
        },
        edgesBySourceNodeId: {},
        edgesByTargetNodeId: {},
      },
    }),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphVisualizerModelIntegrityError)
  if (!(firstError instanceof GraphVisualizerModelIntegrityError)) {
    throw new Error("Expected GraphVisualizerModelIntegrityError")
  }
  expect(firstError.issue._tag).toBe("MissingEdgeEndpoint")
})

test("artifact size validation passes when html is within configured limit", async () => {
  const result = await Effect.runPromiseExit(ensureArtifactSizeWithinLimit("<!doctype html>", 64))
  expect(Exit.isSuccess(result)).toBeTrue()
})

test("artifact size validation fails with tagged error when html exceeds configured limit", async () => {
  const result = await Effect.runPromiseExit(ensureArtifactSizeWithinLimit("x".repeat(10), 4))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected size validation to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphVisualizerArtifactTooLargeError)
  if (!(firstError instanceof GraphVisualizerArtifactTooLargeError)) {
    throw new Error("Expected GraphVisualizerArtifactTooLargeError")
  }
  expect(firstError.actualBytes).toBeGreaterThan(firstError.maxBytes)
})

test("runGraphVisualizer enforces artifact size limit before write", async () => {
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

  const result = await Effect.runPromiseExit(
    runGraphVisualizer({
      from,
      to,
      maxArtifactBytes: 64,
    }).pipe(Effect.provide(NodeServices.layer)),
  )
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphVisualizerArtifactTooLargeError)
})
