import { expect, test } from "bun:test"
import * as BuildGraph from "../src/index"

test("exports only the curated v2 public API surface", () => {
  expect(Object.keys(BuildGraph).sort()).toEqual([
    "BuildGraphAmbiguousWikilinkResolutionError",
    "BuildGraphDuplicatePermalinkError",
    "BuildGraphFrontmatterValidationError",
    "GraphSnapshotSchema",
    "buildGraphSnapshot",
    "buildWikilinkResolverV1Index",
    "formatAmbiguousWikilinkResolutionDiagnostics",
    "normalizeGraphSnapshot",
    "parseWikilinks",
    "resolveWikilinkTargetV1",
    "runWithArgs",
    "serializeGraphSnapshot",
    "summarizeWikilinkResolutionsV1",
    "validateMarkdownSources",
  ])
})
