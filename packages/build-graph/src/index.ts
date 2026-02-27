export {
  buildGraphCommand,
  GRAPH_SNAPSHOT_BACKUP_FILE_NAME,
  GRAPH_SNAPSHOT_FILE_NAME,
  runBuildGraph,
  runWithArgs,
  type BuildGraphInput,
} from "./cli/main"
export { discoverMarkdownFiles, type DiscoveredMarkdownFile } from "./core/discover"
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
