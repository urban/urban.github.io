import { expect, test } from "bun:test"
import { Effect, Exit, Option, Result } from "effect"
import { buildGraphRenderModel, GraphVisualizerModelIntegrityError } from "../src/core/model"
import type { GraphSnapshot } from "../src/domain/schema"

const baseSnapshot: GraphSnapshot = {
  schemaVersion: "2",
  nodes: [
    {
      id: "notes/alpha.md",
      kind: "note",
      relativePath: "notes/alpha.md",
      permalink: "/alpha",
    },
    {
      id: "placeholder:missing/topic",
      kind: "placeholder",
      unresolvedTarget: "missing/topic",
    },
  ],
  edges: [
    {
      sourceNodeId: "notes/alpha.md",
      targetNodeId: "placeholder:missing/topic",
      sourceRelativePath: "notes/alpha.md",
      rawWikilink: "[[missing/topic]]",
      target: "missing/topic",
      resolutionStrategy: "unresolved",
    },
  ],
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "notes/alpha.md",
      rawWikilink: "[[missing/topic]]",
      target: "missing/topic",
      placeholderNodeId: "placeholder:missing/topic",
    },
  ],
  indexes: {
    nodesById: {
      "notes/alpha.md": {
        id: "notes/alpha.md",
        kind: "note",
        relativePath: "notes/alpha.md",
        permalink: "/alpha",
      },
      "placeholder:missing/topic": {
        id: "placeholder:missing/topic",
        kind: "placeholder",
        unresolvedTarget: "missing/topic",
      },
    },
    edgesBySourceNodeId: {
      "notes/alpha.md": [
        {
          sourceNodeId: "notes/alpha.md",
          targetNodeId: "placeholder:missing/topic",
          sourceRelativePath: "notes/alpha.md",
          rawWikilink: "[[missing/topic]]",
          target: "missing/topic",
          resolutionStrategy: "unresolved",
        },
      ],
    },
    edgesByTargetNodeId: {
      "placeholder:missing/topic": [
        {
          sourceNodeId: "notes/alpha.md",
          targetNodeId: "placeholder:missing/topic",
          sourceRelativePath: "notes/alpha.md",
          rawWikilink: "[[missing/topic]]",
          target: "missing/topic",
          resolutionStrategy: "unresolved",
        },
      ],
    },
  },
}

test("builds typed model with note labels and placeholder inclusion", async () => {
  const model = await Effect.runPromise(buildGraphRenderModel(baseSnapshot))

  expect(model.nodes).toEqual([
    {
      id: "notes/alpha.md",
      kind: "note",
      label: "alpha",
      relativePath: "notes/alpha.md",
    },
    {
      id: "placeholder:missing/topic",
      kind: "placeholder",
      label: "missing/topic",
      unresolvedTarget: "missing/topic",
    },
  ])
  expect(model.adjacencyByNodeId).toEqual({
    "notes/alpha.md": ["placeholder:missing/topic"],
    "placeholder:missing/topic": ["notes/alpha.md"],
  })
})

test("fails when an edge references a missing node id", async () => {
  const snapshot: GraphSnapshot = {
    ...baseSnapshot,
    edges: [
      {
        sourceNodeId: "notes/alpha.md",
        targetNodeId: "notes/missing.md",
        sourceRelativePath: "notes/alpha.md",
        rawWikilink: "[[missing]]",
        target: "missing",
        resolutionStrategy: "unresolved",
      },
    ],
  }

  const result = await Effect.runPromiseExit(buildGraphRenderModel(snapshot))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected model build failure")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphVisualizerModelIntegrityError)
  if (!(firstError instanceof GraphVisualizerModelIntegrityError)) {
    throw new Error("Expected GraphVisualizerModelIntegrityError")
  }
  expect(firstError.issue._tag).toBe("MissingEdgeEndpoint")
})

test("fails when duplicate node ids exist", async () => {
  const snapshot: GraphSnapshot = {
    ...baseSnapshot,
    nodes: [
      {
        id: "notes/alpha.md",
        kind: "note",
        relativePath: "notes/alpha.md",
        permalink: "/alpha",
      },
      {
        id: "notes/alpha.md",
        kind: "placeholder",
        unresolvedTarget: "alpha",
      },
    ],
  }

  const result = await Effect.runPromiseExit(buildGraphRenderModel(snapshot))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected duplicate node id failure")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphVisualizerModelIntegrityError)
  if (!(firstError instanceof GraphVisualizerModelIntegrityError)) {
    throw new Error("Expected GraphVisualizerModelIntegrityError")
  }
  expect(firstError.issue._tag).toBe("DuplicateNodeId")
})
