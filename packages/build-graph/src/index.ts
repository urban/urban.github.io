export { runWithArgs } from "./cli/main"
export { discoverMarkdownFiles, type DiscoveredMarkdownFile } from "./cli/discover"
export { buildGraphSnapshot } from "./core/build"
export {
  buildGraphSnapshotFromMarkdownSources,
  buildGraphSnapshotFromRoot,
  type BuildGraphSnapshotResult,
} from "./core/pipeline"
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
  BuildGraphInvalidCanonicalPermalinkError,
  type DuplicatePermalinkDiagnostic,
  validateMarkdownSources,
  type FrontmatterValidationDiagnostic,
  type MarkdownSourceFile,
  type ValidatedMarkdownFile,
} from "./core/validate"
export { GraphSnapshotSchema, type BuildGraphOptions, type GraphSnapshot } from "./domain/schema"
