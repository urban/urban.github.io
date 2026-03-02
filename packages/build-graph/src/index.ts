export { runWithArgs } from "./cli/main"
export { buildGraphSnapshot } from "./core/build"
export { normalizeGraphSnapshot, serializeGraphSnapshot } from "./core/snapshot"
export { parseWikilinks, type ParsedWikilink } from "./core/parse"
export {
  BuildGraphAmbiguousWikilinkResolutionError,
  formatAmbiguousWikilinkResolutionDiagnostics,
  type AmbiguousWikilinkResolutionDiagnostic,
  type ParsedWikilinkWithSource,
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
