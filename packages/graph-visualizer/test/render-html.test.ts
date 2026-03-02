import { expect, test } from "bun:test"
import { renderHtmlFromSnapshot } from "../src/core/render-html"
import type { GraphSnapshot } from "../src/domain/schema"

const snapshot: GraphSnapshot = {
  schemaVersion: "2",
  nodes: [
    {
      id: "notes/a.md",
      kind: "note",
      relativePath: "notes/a.md",
      permalink: "/a",
    },
    {
      id: "placeholder:missing/topic",
      kind: "placeholder",
      unresolvedTarget: "missing/topic",
    },
  ],
  edges: [
    {
      sourceNodeId: "notes/a.md",
      targetNodeId: "placeholder:missing/topic",
      sourceRelativePath: "notes/a.md",
      rawWikilink: "[[missing/topic]]",
      target: "missing/topic",
      resolutionStrategy: "unresolved",
    },
  ],
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "notes/a.md",
      rawWikilink: "[[missing/topic]]",
      target: "missing/topic",
      placeholderNodeId: "placeholder:missing/topic",
    },
  ],
  indexes: {
    nodesById: {
      "notes/a.md": {
        id: "notes/a.md",
        kind: "note",
        relativePath: "notes/a.md",
        permalink: "/a",
      },
      "placeholder:missing/topic": {
        id: "placeholder:missing/topic",
        kind: "placeholder",
        unresolvedTarget: "missing/topic",
      },
    },
    edgesBySourceNodeId: {
      "notes/a.md": [
        {
          sourceNodeId: "notes/a.md",
          targetNodeId: "placeholder:missing/topic",
          sourceRelativePath: "notes/a.md",
          rawWikilink: "[[missing/topic]]",
          target: "missing/topic",
          resolutionStrategy: "unresolved",
        },
      ],
    },
    edgesByTargetNodeId: {
      "placeholder:missing/topic": [
        {
          sourceNodeId: "notes/a.md",
          targetNodeId: "placeholder:missing/topic",
          sourceRelativePath: "notes/a.md",
          rawWikilink: "[[missing/topic]]",
          target: "missing/topic",
          resolutionStrategy: "unresolved",
        },
      ],
    },
  },
}

test("renders standalone html with one canvas and embedded payload", () => {
  const html = renderHtmlFromSnapshot(snapshot)
  expect(html).toContain("<!doctype html>")
  expect(html.match(/<canvas /g)?.length ?? 0).toBe(1)
  expect(html).toContain('id="graph-snapshot"')
  expect(html).toContain('id="graph-canvas"')
  expect(html).toContain('"label":"a"')
  expect(html).toContain('"kind":"placeholder"')
})

test("is deterministic for unchanged snapshot input", () => {
  const first = renderHtmlFromSnapshot(snapshot)
  const second = renderHtmlFromSnapshot(snapshot)
  expect(first).toBe(second)
})
