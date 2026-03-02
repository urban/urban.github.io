import { expect, test } from "bun:test"
import * as BuildGraph from "../src/index"

test("exports only the curated v2 public API surface", () => {
  expect(Object.keys(BuildGraph).sort()).toEqual([
    "BuildGraphAmbiguousWikilinkResolutionError",
    "BuildGraphDuplicatePermalinkError",
    "BuildGraphFrontmatterValidationError",
    "GraphSnapshotSchema",
    "buildGraphSnapshot",
    "formatAmbiguousWikilinkResolutionDiagnostics",
    "normalizeGraphSnapshot",
    "parseWikilinks",
    "runWithArgs",
    "serializeGraphSnapshot",
    "validateMarkdownSources",
  ])
})
