import { expect, test } from "bun:test"
import { makeGraphInteractionRuntime } from "../src/core/runtime-state"
import type { GraphRenderModel } from "../src/core/model"

const model: GraphRenderModel = {
  nodes: [
    {
      id: "notes/a.md",
      kind: "note",
      label: "a",
      relativePath: "notes/a.md",
    },
    {
      id: "notes/b.md",
      kind: "note",
      label: "b",
      relativePath: "notes/b.md",
    },
    {
      id: "notes/c.md",
      kind: "note",
      label: "c",
      relativePath: "notes/c.md",
    },
    {
      id: "placeholder:missing/topic",
      kind: "placeholder",
      label: "missing/topic",
      unresolvedTarget: "missing/topic",
    },
  ],
  edges: [
    {
      sourceNodeId: "notes/a.md",
      targetNodeId: "notes/b.md",
    },
    {
      sourceNodeId: "notes/b.md",
      targetNodeId: "notes/c.md",
    },
    {
      sourceNodeId: "notes/c.md",
      targetNodeId: "placeholder:missing/topic",
    },
  ],
  adjacencyByNodeId: {
    "notes/a.md": ["notes/b.md"],
    "notes/b.md": ["notes/a.md", "notes/c.md"],
    "notes/c.md": ["notes/b.md", "placeholder:missing/topic"],
    "placeholder:missing/topic": ["notes/c.md"],
  },
}

test("default state is neutral with no hover highlight/muting", () => {
  const runtime = makeGraphInteractionRuntime(model)
  expect(runtime.readSnapshot()).toEqual({
    pointerNodeId: null,
    hoveredNodeId: null,
    highlightedNodeIds: [],
    highlightedEdgeIds: [],
    mutedNodeIds: [],
    mutedEdgeIds: [],
  })
})

test("hover highlights hovered 1-hop neighborhood and mutes non-neighborhood", () => {
  const runtime = makeGraphInteractionRuntime(model)
  runtime.setPointerNodeId("notes/b.md")

  expect(runtime.readSnapshot()).toEqual({
    pointerNodeId: "notes/b.md",
    hoveredNodeId: "notes/b.md",
    highlightedNodeIds: ["notes/a.md", "notes/b.md", "notes/c.md"],
    highlightedEdgeIds: ["notes/a.md=>notes/b.md", "notes/b.md=>notes/c.md"],
    mutedNodeIds: ["placeholder:missing/topic"],
    mutedEdgeIds: ["notes/c.md=>placeholder:missing/topic"],
  })
})

test("hover exit resets highlight and muted sets", () => {
  const runtime = makeGraphInteractionRuntime(model)
  runtime.setPointerNodeId("notes/b.md")
  runtime.setPointerNodeId(null)

  expect(runtime.readSnapshot()).toEqual({
    pointerNodeId: null,
    hoveredNodeId: null,
    highlightedNodeIds: [],
    highlightedEdgeIds: [],
    mutedNodeIds: [],
    mutedEdgeIds: [],
  })
})
