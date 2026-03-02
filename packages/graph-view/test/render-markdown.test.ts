import { expect, test } from "bun:test"
import type { GraphSnapshot } from "@urban/build-graph/src/domain/schema"
import { renderMarkdownFromSnapshot } from "../src/core/render-markdown"

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

const emptySnapshot: GraphSnapshot = {
  schemaVersion: "2",
  nodes: [],
  edges: [],
  diagnostics: [],
  indexes: {
    nodesById: {},
    edgesBySourceNodeId: {},
    edgesByTargetNodeId: {},
  },
}

test("renders the baseline graph markdown wrapper", () => {
  const markdown = renderMarkdownFromSnapshot(emptySnapshot)

  expect(markdown).toBe("## Graph\n\n```mermaid\ngraph LR\n```\n")
})

test("renders markdown with note nodes and unlabeled edges", () => {
  const nodes: GraphSnapshot["nodes"] = [
    {
      id: "notes/b.md",
      kind: "note",
      relativePath: "notes/b.md",
      permalink: "/b",
    },
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
      targetNodeId: "notes/b.md",
      sourceRelativePath: "notes/a.md",
      rawWikilink: "[[b]]",
      target: "b",
      resolutionStrategy: "path",
    },
  ]

  const snapshot: GraphSnapshot = {
    schemaVersion: "2",
    nodes,
    edges,
    diagnostics: [],
    indexes: buildIndexes(nodes, edges),
  }

  const markdown = renderMarkdownFromSnapshot(snapshot)

  expect(markdown).toBe(
    '## Graph\n\n```mermaid\ngraph LR\n  0["notes/a.md"]\n  1["notes/b.md"]\n  0 --- 1\n```\n',
  )
})
