export { runWithArgs } from "./cli/main"
export { buildGraphSnapshot } from "./core/build"
export { normalizeGraphSnapshot, serializeGraphSnapshot } from "./core/snapshot"
export { parseWikilinks, type ParsedWikilink } from "./core/parse"
export {
  buildWikilinkResolverV1Index,
  BuildGraphAmbiguousWikilinkResolutionError,
  formatAmbiguousWikilinkResolutionDiagnostics,
  resolveWikilinkTargetV1,
  summarizeWikilinkResolutionsV1,
  type AmbiguousWikilinkResolutionDiagnostic,
  type ParsedWikilinkWithSource,
  type WikilinkResolutionV1,
  type WikilinkResolutionSummaryV1,
} from "./core/resolve"
export {
  BuildGraphDuplicatePermalinkError,
  BuildGraphFrontmatterValidationError,
  type DuplicatePermalinkDiagnostic,
  validateMarkdownSources,
  type FrontmatterValidationDiagnostic,
  type MarkdownSourceFile,
  type ValidatedMarkdownFile,
} from "./core/validate"
export { GraphSnapshotSchema, type GraphSnapshot } from "./domain/schema"
