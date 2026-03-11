import { expect, test } from "bun:test"
import * as BuildGraph from "../src/index"

test("exports only the curated v2 public API surface", () => {
  expect(Object.keys(BuildGraph).sort()).toEqual([
    "BuildGraphAmbiguousWikilinkResolutionError",
    "BuildGraphDuplicatePermalinkError",
    "BuildGraphFrontmatterValidationError",
    "BuildGraphInvalidCanonicalPermalinkError",
    "GraphSnapshotSchema",
    "buildGraphSnapshot",
    "buildGraphSnapshotFromMarkdownSources",
    "buildGraphSnapshotFromRoot",
    "discoverMarkdownFiles",
    "formatAmbiguousWikilinkResolutionDiagnostics",
    "normalizeGraphSnapshot",
    "parseWikilinks",
    "runWithArgs",
    "serializeGraphSnapshot",
    "validateMarkdownSources",
  ])
})
