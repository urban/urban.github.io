import { expect, test } from "bun:test"
import { serializeGraphSnapshot } from "../src/core/snapshot"
import type { GraphSnapshot } from "../src/domain/schema"

const makeUnsortedSnapshot = (): GraphSnapshot => ({
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
})

test("serializes deterministic, byte-stable snapshots", () => {
  const first = serializeGraphSnapshot(makeUnsortedSnapshot())
  const second = serializeGraphSnapshot(makeUnsortedSnapshot())

  expect(first).toBe(second)
  expect(first).toBe(
    `{\n  "nodes": [\n    {\n      "id": "a.md",\n      "kind": "note",\n      "relativePath": "a.md",\n      "permalink": "/a"\n    },\n    {\n      "id": "placeholder:missing",\n      "kind": "placeholder",\n      "unresolvedTarget": "missing"\n    },\n    {\n      "id": "z.md",\n      "kind": "note",\n      "relativePath": "z.md",\n      "permalink": "/z"\n    }\n  ],\n  "edges": [\n    {\n      "sourceNodeId": "a.md",\n      "targetNodeId": "z.md",\n      "sourceRelativePath": "a.md",\n      "rawWikilink": "[[z|Z]]",\n      "target": "z",\n      "displayText": "Z",\n      "resolutionStrategy": "path"\n    },\n    {\n      "sourceNodeId": "z.md",\n      "targetNodeId": "placeholder:missing",\n      "sourceRelativePath": "z.md",\n      "rawWikilink": "[[missing]]",\n      "target": "missing",\n      "resolutionStrategy": "unresolved"\n    }\n  ],\n  "diagnostics": [\n    {\n      "type": "unresolved-wikilink",\n      "sourceRelativePath": "z.md",\n      "rawWikilink": "[[missing]]",\n      "target": "missing",\n      "placeholderNodeId": "placeholder:missing"\n    }\n  ]\n}\n`,
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
  } as unknown as GraphSnapshot

  expect(() => serializeGraphSnapshot(invalidSnapshot)).toThrow()
})
