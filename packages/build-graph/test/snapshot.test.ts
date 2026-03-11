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
      sourceRelativePath: "z.md",
      permalink: "/z",
      slug: "z",
      routePath: "/z",
      label: "z",
      created: "2026-02-01",
      updated: "2026-02-02",
      aliases: [],
      published: true,
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
      sourceRelativePath: "a.md",
      permalink: "/a",
      slug: "a",
      routePath: "/a",
      label: "a",
      created: "2026-02-01",
      updated: "2026-02-02",
      aliases: [],
      published: true,
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
    noteNodeIdBySlug: {},
    noteNodeIdByRoutePath: {},
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
  expect(snapshot.indexes.noteNodeIdBySlug).toEqual({ a: "a.md", z: "z.md" })
  expect(snapshot.indexes.noteNodeIdByRoutePath).toEqual({ "/a": "a.md", "/z": "z.md" })
  expect(snapshot.nodes.map((node) => snapshot.indexes.nodesById[node.id])).toEqual([
    ...snapshot.nodes,
  ])
  expect(snapshot.indexes.edgesBySourceNodeId["a.md"]).toEqual(
    snapshot.edges.filter((edge) => edge.sourceNodeId === "a.md"),
  )
  expect(snapshot.indexes.edgesBySourceNodeId["z.md"]).toEqual(
    snapshot.edges.filter((edge) => edge.sourceNodeId === "z.md"),
  )
  expect(snapshot.indexes.edgesByTargetNodeId["placeholder:missing"]).toEqual(
    snapshot.edges.filter((edge) => edge.targetNodeId === "placeholder:missing"),
  )
  expect(snapshot.indexes.edgesByTargetNodeId["z.md"]).toEqual(
    snapshot.edges.filter((edge) => edge.targetNodeId === "z.md"),
  )
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

test("fails when node ids are duplicated and indexes cannot stay identity-consistent", () => {
  const duplicateNodeIdsSnapshot = {
    nodes: [
      {
        id: "dup.md",
        kind: "note",
        relativePath: "dup.md",
        sourceRelativePath: "dup.md",
        permalink: "/dup-a",
        slug: "dup-a",
        routePath: "/dup-a",
        label: "dup-a",
        created: "2026-02-01",
        updated: "2026-02-02",
        aliases: [],
        published: true,
      },
      {
        id: "dup.md",
        kind: "placeholder",
        unresolvedTarget: "dup",
      },
    ],
    edges: [],
    diagnostics: [],
  }

  expect(() => serializeGraphSnapshot(duplicateNodeIdsSnapshot)).toThrow(
    "Duplicate node id in snapshot nodes: dup.md",
  )
})

test("fails when an edge references a missing node id", () => {
  const missingNodeReferenceSnapshot = {
    nodes: [
      {
        id: "a.md",
        kind: "note",
        relativePath: "a.md",
        sourceRelativePath: "a.md",
        permalink: "/a",
        slug: "a",
        routePath: "/a",
        label: "a",
        created: "2026-02-01",
        updated: "2026-02-02",
        aliases: [],
        published: true,
      },
    ],
    edges: [
      {
        sourceNodeId: "a.md",
        targetNodeId: "missing.md",
        sourceRelativePath: "a.md",
        rawWikilink: "[[missing]]",
        target: "missing",
        resolutionStrategy: "unresolved",
      },
    ],
    diagnostics: [],
  }

  expect(() => serializeGraphSnapshot(missingNodeReferenceSnapshot)).toThrow(
    "Edge references missing target node id: missing.md",
  )
})
