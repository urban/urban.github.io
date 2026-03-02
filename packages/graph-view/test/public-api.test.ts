import { expect, test } from "bun:test"
import * as graphView from "../src/index"

test("exposes a stable top-level public api surface", () => {
  expect(Object.keys(graphView).sort()).toEqual([
    "GraphSnapshotEdgeSchema",
    "GraphSnapshotNodeSchema",
    "GraphSnapshotNoteNodeSchema",
    "GraphSnapshotPlaceholderNodeSchema",
    "GraphSnapshotResolutionStrategySchema",
    "GraphSnapshotSchema",
    "GraphViewCliReadError",
    "GraphViewCliValidationError",
    "GraphViewCliWriteError",
    "GraphViewJsonParseError",
    "GraphViewSnapshotValidationError",
    "UnresolvedWikilinkDiagnosticSchema",
    "decodeGraphSnapshot",
    "graphViewCommand",
    "renderMarkdownFromSnapshot",
    "renderMermaidFromSnapshot",
    "runGraphView",
    "runWithArgs",
  ])
})
