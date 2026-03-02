import { expect, test } from "bun:test"
import * as graphVisualizer from "../src/index"

test("exposes a stable top-level public api surface", () => {
  expect(Object.keys(graphVisualizer).sort()).toEqual([
    "GraphSnapshotEdgeSchema",
    "GraphSnapshotIndexesSchema",
    "GraphSnapshotNodeSchema",
    "GraphSnapshotNoteNodeSchema",
    "GraphSnapshotPlaceholderNodeSchema",
    "GraphSnapshotResolutionStrategySchema",
    "GraphSnapshotSchema",
    "GraphSnapshotSchemaVersionSchema",
    "GraphVisualizerCliValidationError",
    "GraphVisualizerJsonParseError",
    "GraphVisualizerModelIntegrityError",
    "GraphVisualizerSnapshotValidationError",
    "UnresolvedWikilinkDiagnosticSchema",
    "buildGraphRenderModel",
    "decodeGraphSnapshot",
    "graphVisualizerCommand",
    "renderHtmlFromModel",
    "renderHtmlFromSnapshot",
    "runGraphVisualizer",
    "runWithArgs",
  ])
})
