export {
  buildGraphCommand,
  GRAPH_SNAPSHOT_BACKUP_FILE_NAME,
  GRAPH_SNAPSHOT_FILE_NAME,
  runBuildGraph,
  runWithArgs,
  type BuildGraphInput,
} from "./cli/main"
export { discoverMarkdownFiles, type DiscoveredMarkdownFile } from "./core/discover"
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
  type WikilinkResolverV1Index,
  type WikilinkResolutionSummaryV1,
} from "./core/resolve"
export {
  BuildGraphDuplicatePermalinkError,
  BuildGraphFrontmatterValidationError,
  type DuplicatePermalinkDiagnostic,
  validateDiscoveredMarkdownFiles,
  type FrontmatterValidationDiagnostic,
  type ValidatedMarkdownFile,
} from "./core/validate"
export {
  IsoDateOnlyString,
  NoteFrontmatterSchema,
  RawNoteFrontmatterSchema,
  normalizeRawNoteFrontmatter,
  type NoteFrontmatter,
  type RawNoteFrontmatter,
} from "./domain/schema"
