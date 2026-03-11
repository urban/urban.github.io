import { expect, test } from "bun:test"
import * as graphView from "../src/index"

test("exposes a stable top-level public api surface", () => {
  expect(Object.keys(graphView).sort()).toEqual([
    "GraphSnapshotEdgeSchema",
    "GraphSnapshotIndexesSchema",
    "GraphSnapshotNodeSchema",
    "GraphSnapshotNoteNodeSchema",
    "GraphSnapshotPlaceholderNodeSchema",
    "GraphSnapshotResolutionStrategySchema",
    "GraphSnapshotSchema",
    "GraphSnapshotSchemaVersionSchema",
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
