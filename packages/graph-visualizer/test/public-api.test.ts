import { expect, test } from "bun:test"
import * as graphVisualizer from "../src/index"

test("exposes a stable top-level public api surface", () => {
  expect(Object.keys(graphVisualizer).sort()).toEqual([
    "GRAPH_VISUALIZER_MAX_ARTIFACT_BYTES",
    "GraphSnapshotSchema",
    "GraphVisualizerArtifactTooLargeError",
    "GraphVisualizerCliFileSystemError",
    "GraphVisualizerCliValidationError",
    "GraphVisualizerJsonParseError",
    "GraphVisualizerModelIntegrityError",
    "GraphVisualizerSnapshotValidationError",
    "buildGraphRenderModel",
    "decodeGraphSnapshot",
    "renderHtmlFromModel",
    "renderHtmlFromSnapshot",
    "runWithArgs",
  ])
})
