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
  ],
  edges: [],
  diagnostics: [],
  indexes: {
    nodesById: {
      "notes/a.md": {
        id: "notes/a.md",
        kind: "note",
        relativePath: "notes/a.md",
        permalink: "/a",
      },
    },
    edgesBySourceNodeId: {},
    edgesByTargetNodeId: {},
  },
}

test("renders standalone html with one canvas and embedded payload", () => {
  const html = renderHtmlFromSnapshot(snapshot)
  expect(html).toContain("<!doctype html>")
  expect(html.match(/<canvas /g)?.length ?? 0).toBe(1)
  expect(html).toContain('id="graph-snapshot"')
  expect(html).toContain('id="graph-canvas"')
})

test("is deterministic for unchanged snapshot input", () => {
  const first = renderHtmlFromSnapshot(snapshot)
  const second = renderHtmlFromSnapshot(snapshot)
  expect(first).toBe(second)
})
