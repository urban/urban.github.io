import { expect, test } from "bun:test"
import { renderMermaidFromSnapshot } from "../src/core/render-mermaid"
import type { GraphSnapshot } from "../src/domain/schema"
import { makeGraphSnapshot } from "./fixtures"

const snapshotWithNotesAndEdges: GraphSnapshot = makeGraphSnapshot({
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
      title: "A Title",
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
})

const canonicalRouteSnapshot: GraphSnapshot = makeGraphSnapshot({
  nodes: [
    {
      id: "/vault/tool-adapter-contract",
      kind: "note",
      relativePath: "Tool Adapter Contract.md",
      sourceRelativePath: "Tool Adapter Contract.md",
      permalink: "/tool-adapter-contract",
      slug: "tool-adapter-contract",
      routePath: "/vault/tool-adapter-contract",
      label: "Tool Adapter Contract",
      created: "2026-02-03",
      updated: "2026-02-04",
      published: true,
    },
    {
      id: "/vault/harness-loop",
      kind: "note",
      relativePath: "Harness Loop.md",
      sourceRelativePath: "Harness Loop.md",
      permalink: "/harness-loop",
      slug: "harness-loop",
      routePath: "/vault/harness-loop",
      label: "Harness Loop",
      title: "Harness Loop Title",
      created: "2026-02-01",
      updated: "2026-02-02",
      aliases: ["Loop Harness"],
      published: true,
    },
    {
      id: "placeholder:missing-route",
      kind: "placeholder",
      unresolvedTarget: "missing-route",
    },
  ],
  edges: [
    {
      sourceNodeId: "/vault/harness-loop",
      targetNodeId: "/vault/tool-adapter-contract",
      sourceRelativePath: "Harness Loop.md",
      rawWikilink: "[[tool-adapter-contract]]",
      target: "tool-adapter-contract",
      resolutionStrategy: "path",
    },
    {
      sourceNodeId: "/vault/harness-loop",
      targetNodeId: "placeholder:missing-route",
      sourceRelativePath: "Harness Loop.md",
      rawWikilink: "[[missing-route]]",
      target: "missing-route",
      resolutionStrategy: "unresolved",
    },
  ],
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "Harness Loop.md",
      rawWikilink: "[[missing-route]]",
      target: "missing-route",
      placeholderNodeId: "placeholder:missing-route",
    },
  ],
})

test("renders note nodes and unlabeled note-to-note edges with graph LR", () => {
  const mermaid = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)

  expect(mermaid).toBe(
    'graph LR\n  n0["A Title"]\n  n1["notes/z.md"]\n  n2["unresolved:missing"]\n  n0 --> n1\n  n1 --> n0\n  n1 --> n2\n  classDef unresolved fill:#fff4e5,stroke:#d97706,color:#7c2d12,stroke-width:1px\n  class n2 unresolved',
  )
  expect(mermaid.includes("|")).toBeFalse()
})

test("renders canonical-route node ids with title then label precedence", () => {
  const mermaid = renderMermaidFromSnapshot(canonicalRouteSnapshot)

  expect(mermaid).toBe(
    'graph LR\n  n0["Harness Loop Title"]\n  n1["Tool Adapter Contract"]\n  n2["unresolved:missing-route"]\n  n0 --> n1\n  n0 --> n2\n  classDef unresolved fill:#fff4e5,stroke:#d97706,color:#7c2d12,stroke-width:1px\n  class n2 unresolved',
  )
})

test("renders deterministic mermaid text for unchanged input", () => {
  const first = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)
  const second = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)

  expect(first).toBe(second)
})

test("renders deterministic mermaid text regardless of node and edge input order", () => {
  const reorderedSnapshot: GraphSnapshot = {
    ...snapshotWithNotesAndEdges,
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
  }

  const first = renderMermaidFromSnapshot(snapshotWithNotesAndEdges)
  const second = renderMermaidFromSnapshot(reorderedSnapshot)

  expect(first).toBe(second)
})
