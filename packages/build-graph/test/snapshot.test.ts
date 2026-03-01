import { expect, test } from "bun:test"
import { Schema } from "effect"
import { serializeGraphSnapshot } from "../src/core/snapshot"
import { GraphSnapshotSchema, type GraphSnapshot } from "../src/domain/schema"

const decodeGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

const makeUnsortedSnapshot = (): GraphSnapshot => ({
  schemaVersion: "2",
  nodes: [
    {
      id: "z.md",
      kind: "note",
      relativePath: "z.md",
      permalink: "/z",
    },
    {
      id: "placeholder:missing",
      kind: "placeholder",
      unresolvedTarget: "missing",
    },
    {
      id: "a.md",
      kind: "note",
      relativePath: "a.md",
      permalink: "/a",
    },
  ],
  edges: [
    {
      sourceNodeId: "z.md",
      targetNodeId: "placeholder:missing",
      sourceRelativePath: "z.md",
      rawWikilink: "[[missing]]",
      target: "missing",
      resolutionStrategy: "unresolved",
    },
    {
      sourceNodeId: "a.md",
      targetNodeId: "z.md",
      sourceRelativePath: "a.md",
      rawWikilink: "[[z|Z]]",
      target: "z",
      displayText: "Z",
      resolutionStrategy: "path",
    },
  ],
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "z.md",
      rawWikilink: "[[missing]]",
      target: "missing",
      placeholderNodeId: "placeholder:missing",
    },
  ],
  indexes: {
    nodesById: {},
    edgesBySourceNodeId: {},
    edgesByTargetNodeId: {},
  },
})

test("serializes deterministic, byte-stable snapshots", () => {
  const first = serializeGraphSnapshot(makeUnsortedSnapshot())
  const second = serializeGraphSnapshot(makeUnsortedSnapshot())

  expect(first).toBe(second)
  const snapshot = decodeGraphSnapshot(JSON.parse(first))
  expect(snapshot.schemaVersion).toBe("2")
  expect(Object.keys(snapshot.indexes.nodesById)).toEqual(["a.md", "placeholder:missing", "z.md"])
  expect(Object.keys(snapshot.indexes.edgesBySourceNodeId)).toEqual(["a.md", "z.md"])
  expect(Object.keys(snapshot.indexes.edgesByTargetNodeId)).toEqual(["placeholder:missing", "z.md"])
})

test("enforces snapshot contract shape via schema", () => {
  const invalidSnapshot = {
    nodes: [
      {
        id: "a.md",
        kind: "note",
      },
    ],
    edges: [],
    diagnostics: [],
    schemaVersion: "2",
    indexes: {
      nodesById: {},
      edgesBySourceNodeId: {},
      edgesByTargetNodeId: {},
    },
  }

  expect(() => serializeGraphSnapshot(invalidSnapshot)).toThrow()
})
