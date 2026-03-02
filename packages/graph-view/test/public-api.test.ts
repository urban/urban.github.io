import { expect, test } from "bun:test"
import * as graphView from "../src/index"

test("exposes a stable top-level public api surface", () => {
  expect(Object.keys(graphView).sort()).toEqual([
    "GraphViewCliReadError",
    "GraphViewCliValidationError",
    "GraphViewCliWriteError",
    "GraphViewJsonParseError",
    "GraphViewSnapshotValidationError",
    "decodeGraphSnapshot",
    "graphViewCommand",
    "renderMarkdownFromSnapshot",
    "renderMermaidFromSnapshot",
    "runGraphView",
    "runWithArgs",
  ])
})
