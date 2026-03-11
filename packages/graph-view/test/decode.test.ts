import { expect, test } from "bun:test"
import { Effect, Exit, Option, Result } from "effect"
import {
  decodeGraphSnapshot,
  GraphViewJsonParseError,
  GraphViewSnapshotValidationError,
} from "../src/core/decode"
import type { GraphSnapshot } from "../src/domain/schema"
import { makeGraphSnapshot } from "./fixtures"

const validSnapshot: GraphSnapshot = makeGraphSnapshot({
  nodes: [
    {
      id: "/vault/a",
      kind: "note",
      relativePath: "notes/a.md",
      sourceRelativePath: "notes/a.md",
      permalink: "/a",
      slug: "a",
      routePath: "/vault/a",
      label: "A",
      created: "2026-03-01",
      updated: "2026-03-02",
      aliases: ["Alpha"],
      published: true,
      title: "Note A",
      description: "Primary note",
    },
  ],
})

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
