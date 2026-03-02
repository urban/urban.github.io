import { expect, test } from "bun:test"
import { Effect, Exit, Option, Result } from "effect"
import {
  decodeGraphSnapshot,
  GraphViewJsonParseError,
  GraphViewSnapshotValidationError,
} from "../src/core/decode"
import type { GraphSnapshot } from "../src/domain/schema"

const validSnapshot: GraphSnapshot = {
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
