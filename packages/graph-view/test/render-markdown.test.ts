import { expect, test } from "bun:test"
import { renderMarkdownFromSnapshot } from "../src/core/render-markdown"
import type { GraphSnapshot } from "../src/domain/schema"

const emptySnapshot: GraphSnapshot = {
  nodes: [],
  edges: [],
  diagnostics: [],
}

test("renders the baseline graph markdown wrapper", () => {
  const markdown = renderMarkdownFromSnapshot(emptySnapshot)

  expect(markdown).toBe("## Graph\n\n```mermaid\ngraph LR\n```\n")
})

test("renders markdown with note nodes and unlabeled edges", () => {
  const snapshot: GraphSnapshot = {
    nodes: [
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
    ],
    edges: [
      {
        sourceNodeId: "notes/a.md",
        targetNodeId: "notes/b.md",
        sourceRelativePath: "notes/a.md",
        rawWikilink: "[[b]]",
        target: "b",
        resolutionStrategy: "path",
      },
    ],
    diagnostics: [],
  }

  const markdown = renderMarkdownFromSnapshot(snapshot)

  expect(markdown).toBe(
    '## Graph\n\n```mermaid\ngraph LR\n  n0["notes/a.md"]\n  n1["notes/b.md"]\n  n0 --> n1\n```\n',
  )
})
