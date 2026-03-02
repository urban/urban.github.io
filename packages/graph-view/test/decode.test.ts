import { expect, test } from "bun:test"
import { Effect, Exit, Option, Result } from "effect"
import {
  decodeGraphSnapshot,
  GraphViewJsonParseError,
  GraphViewSnapshotValidationError,
} from "../src/core/decode"
import type { GraphSnapshot } from "@urban/build-graph/src/domain/schema"

const validSnapshot: GraphSnapshot = {
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
}

test("decodes a valid graph snapshot object", async () => {
  const result = await Effect.runPromise(decodeGraphSnapshot(validSnapshot))
  expect(result).toEqual(validSnapshot)
})

test("decodes a valid graph snapshot JSON string", async () => {
  const result = await Effect.runPromise(decodeGraphSnapshot(JSON.stringify(validSnapshot)))
  expect(result).toEqual(validSnapshot)
})

test("fails decode on invalid JSON string input", async () => {
  const result = await Effect.runPromiseExit(decodeGraphSnapshot("{ nope"))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected decode to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewJsonParseError)
})

test("fails decode on schema-invalid input", async () => {
  const result = await Effect.runPromiseExit(
    decodeGraphSnapshot(
      JSON.stringify({
        schemaVersion: "2",
        nodes: [],
        edges: [],
      }),
    ),
  )
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected decode to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewSnapshotValidationError)
})

test("fails decode on non-v2 snapshot payload", async () => {
  const result = await Effect.runPromiseExit(
    decodeGraphSnapshot(
      JSON.stringify({
        schemaVersion: "1",
        nodes: [],
        edges: [],
        diagnostics: [],
        indexes: {
          nodesById: {},
          edgesBySourceNodeId: {},
          edgesByTargetNodeId: {},
        },
      }),
    ),
  )
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected decode to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(GraphViewSnapshotValidationError)
})
