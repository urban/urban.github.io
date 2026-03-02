import { expect, test } from "bun:test"
import type { GraphSnapshot } from "@urban/build-graph/src/domain/schema"
import { renderMermaidFromSnapshot } from "../src/core/render-mermaid"
import { GraphViewRenderInvariantError } from "../src/core/render-model"

const buildIndexes = (
  nodes: GraphSnapshot["nodes"],
  edges: GraphSnapshot["edges"],
): GraphSnapshot["indexes"] => {
  const nodesById: Record<string, GraphSnapshot["nodes"][number]> = {}
  for (const node of nodes) {
    nodesById[node.id] = node
  }

  const edgesBySourceNodeId: Record<string, Array<GraphSnapshot["edges"][number]>> = {}
  const edgesByTargetNodeId: Record<string, Array<GraphSnapshot["edges"][number]>> = {}
  for (const edge of edges) {
    const sourceEdges = edgesBySourceNodeId[edge.sourceNodeId] ?? []
    sourceEdges.push(edge)
    edgesBySourceNodeId[edge.sourceNodeId] = sourceEdges

    const targetEdges = edgesByTargetNodeId[edge.targetNodeId] ?? []
    targetEdges.push(edge)
    edgesByTargetNodeId[edge.targetNodeId] = targetEdges
  }

  return {
    nodesById,
    edgesBySourceNodeId,
    edgesByTargetNodeId,
  }
}

const snapshotNodes: GraphSnapshot["nodes"] = [
  {
    id: "notes/z.md",
    kind: "note",
    relativePath: "notes/z.md",
    permalink: "/z",
  },
  {
    id: "placeholder:missing",
    kind: "placeholder",
    unresolvedTarget: "missing",
  },
  {
    id: "notes/a.md",
    kind: "note",
    relativePath: "notes/a.md",
    permalink: "/a",
  },
]

const snapshotEdges: GraphSnapshot["edges"] = [
  {
    sourceNodeId: "notes/z.md",
    targetNodeId: "notes/a.md",
    sourceRelativePath: "notes/z.md",
    rawWikilink: "[[a|A]]",
    target: "a",
    displayText: "A",
    resolutionStrategy: "path",
  },
  {
    sourceNodeId: "notes/z.md",
    targetNodeId: "placeholder:missing",
    sourceRelativePath: "notes/z.md",
    rawWikilink: "[[missing]]",
    target: "missing",
    resolutionStrategy: "unresolved",
  },
  {
    sourceNodeId: "notes/a.md",
    targetNodeId: "notes/z.md",
    sourceRelativePath: "notes/a.md",
    rawWikilink: "[[z]]",
    target: "z",
    resolutionStrategy: "path",
  },
]

const snapshotWithNotesAndEdges: GraphSnapshot = {
  schemaVersion: "2",
  nodes: snapshotNodes,
  edges: snapshotEdges,
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "notes/z.md",
      rawWikilink: "[[missing]]",
      target: "missing",
      placeholderNodeId: "placeholder:missing",
    },
  ],
  indexes: buildIndexes(snapshotNodes, snapshotEdges),
}

test("renders note nodes and unlabeled note-to-note edges with graph LR", () => {
  const mermaid = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)

  expect(mermaid).toBe(
    'graph LR\n  0["notes/a.md"]\n  1["notes/z.md"]\n  2{{"unresolved:missing"}}\n  0 --- 1\n  1 --- 0\n  1 --- 2',
  )
  expect(mermaid.includes("|")).toBeFalse()
})

test("renders deterministic mermaid text for unchanged input", () => {
  const first = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)
  const second = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)

  expect(first).toBe(second)
})

test("renders deterministic mermaid text regardless of node and edge input order", () => {
  const reorderedNodes: GraphSnapshot["nodes"] = [
    snapshotWithNotesAndEdges.nodes[2],
    snapshotWithNotesAndEdges.nodes[0],
    snapshotWithNotesAndEdges.nodes[1],
  ]
  const reorderedEdges: GraphSnapshot["edges"] = [
    snapshotWithNotesAndEdges.edges[2],
    snapshotWithNotesAndEdges.edges[0],
    snapshotWithNotesAndEdges.edges[1],
  ]

  const reorderedSnapshot: GraphSnapshot = {
    schemaVersion: "2",
    nodes: reorderedNodes,
    edges: reorderedEdges,
    diagnostics: snapshotWithNotesAndEdges.diagnostics,
    indexes: buildIndexes(reorderedNodes, reorderedEdges),
  }

  const first = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)
  const second = renderMermaidFromSnapshot(reorderedSnapshot)

  expect(first).toBe(second)
})

test("fails when an edge references a missing target node id", () => {
  const nodes: GraphSnapshot["nodes"] = [
    {
      id: "notes/a.md",
      kind: "note",
      relativePath: "notes/a.md",
      permalink: "/a",
    },
  ]
  const edges: GraphSnapshot["edges"] = [
    {
      sourceNodeId: "notes/a.md",
      targetNodeId: "notes/missing.md",
      sourceRelativePath: "notes/a.md",
      rawWikilink: "[[missing]]",
      target: "missing",
      resolutionStrategy: "path",
    },
  ]

  const invalidSnapshot: GraphSnapshot = {
    schemaVersion: "2",
    nodes,
    edges,
    diagnostics: [],
    indexes: buildIndexes(nodes, edges),
  }

  expect(() => renderMermaidFromSnapshot(invalidSnapshot)).toThrow(GraphViewRenderInvariantError)
})

test("fails when snapshot contains duplicate node ids", () => {
  const nodes: GraphSnapshot["nodes"] = [
    {
      id: "duplicate",
      kind: "note",
      relativePath: "notes/a.md",
      permalink: "/a",
    },
    {
      id: "duplicate",
      kind: "note",
      relativePath: "notes/b.md",
      permalink: "/b",
    },
  ]

  const invalidSnapshot: GraphSnapshot = {
    schemaVersion: "2",
    nodes,
    edges: [],
    diagnostics: [],
    indexes: buildIndexes(nodes, []),
  }

  expect(() => renderMermaidFromSnapshot(invalidSnapshot)).toThrow(GraphViewRenderInvariantError)
})
