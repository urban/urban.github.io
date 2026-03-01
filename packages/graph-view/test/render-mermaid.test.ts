import { expect, test } from "bun:test"
import { renderMermaidFromSnapshot } from "../src/core/render-mermaid"
import type { GraphSnapshot } from "../src/domain/schema"

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
    'graph LR\n  n0["notes/a.md"]\n  n1["notes/z.md"]\n  n2["unresolved:missing"]\n  n0 --> n1\n  n1 --> n0\n  n1 --> n2\n  classDef unresolved fill:#fff4e5,stroke:#d97706,color:#7c2d12,stroke-width:1px\n  class n2 unresolved',
  )
  expect(mermaid.includes("|")).toBeFalse()
})

test("renders deterministic mermaid text for unchanged input", () => {
  const first = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)
  const second = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)

  expect(first).toBe(second)
})
