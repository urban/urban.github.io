import { expect, test } from "bun:test"
import { renderMermaidFromSnapshot } from "../src/core/render-mermaid"
import type { GraphSnapshot } from "../src/domain/schema"
import { GraphViewRenderInvariantError } from "../src/core/render-model"

const snapshotWithNotesAndEdges: GraphSnapshot = {
  nodes: [
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
  ],
  edges: [
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
  ],
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "notes/z.md",
      rawWikilink: "[[missing]]",
      target: "missing",
      placeholderNodeId: "placeholder:missing",
    },
  ],
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
  const reorderedSnapshot: GraphSnapshot = {
    nodes: [
      snapshotWithNotesAndEdges.nodes[2],
      snapshotWithNotesAndEdges.nodes[0],
      snapshotWithNotesAndEdges.nodes[1],
    ],
    edges: [
      snapshotWithNotesAndEdges.edges[2],
      snapshotWithNotesAndEdges.edges[0],
      snapshotWithNotesAndEdges.edges[1],
    ],
    diagnostics: snapshotWithNotesAndEdges.diagnostics,
  }

  const first = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)
  const second = renderMermaidFromSnapshot(reorderedSnapshot)

  expect(first).toBe(second)
})

test("fails when an edge references a missing target node id", () => {
  const invalidSnapshot: GraphSnapshot = {
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
        resolutionStrategy: "path",
      },
    ],
    diagnostics: [],
  }

  expect(() => renderMermaidFromSnapshot(invalidSnapshot)).toThrow(GraphViewRenderInvariantError)
})

test("fails when snapshot contains duplicate node ids", () => {
  const invalidSnapshot: GraphSnapshot = {
    nodes: [
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
    ],
    edges: [],
    diagnostics: [],
  }

  expect(() => renderMermaidFromSnapshot(invalidSnapshot)).toThrow(GraphViewRenderInvariantError)
})
