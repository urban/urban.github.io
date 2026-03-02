import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, FileSystem, Path, Schema } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { discoverMarkdownFiles } from "./discover"
import { buildGraphSnapshot } from "../core/build"
import { parseWikilinks } from "../core/parse"
import { serializeGraphSnapshot } from "../core/snapshot"
import { validateMarkdownSources, type MarkdownSourceFile } from "../core/validate"

export const GRAPH_SNAPSHOT_FILE_NAME = "graph-snapshot.json"
export const GRAPH_SNAPSHOT_BACKUP_FILE_NAME = `${GRAPH_SNAPSHOT_FILE_NAME}.bak`
const CLI_VERSION = "0.0.0"

export type BuildGraphInput = {
  readonly from: string
  readonly to: string
}

export class BuildGraphCliValidationError extends Schema.TaggedErrorClass<BuildGraphCliValidationError>()(
  "BuildGraphCliValidationError",
  {
    message: Schema.String,
  },
) {}

const ensureDirectory = Effect.fn("buildGraphCli.ensureDirectory")(function* (
  label: "from" | "to",
  path: string,
) {
  const fs = yield* FileSystem.FileSystem
  const exists = yield* fs.exists(path)

  if (!exists) {
    return yield* new BuildGraphCliValidationError({
      message: `Invalid ${label} directory: ${path} does not exist`,
    })
  }

  const stat = yield* fs.stat(path)
  if (stat.type !== "Directory") {
    return yield* new BuildGraphCliValidationError({
      message: `Invalid ${label} directory: ${path} is not a directory`,
    })
  }
})

const loadMarkdownSources = Effect.fn("buildGraphCli.loadMarkdownSources")(function* (
  markdownFiles: ReadonlyArray<{ readonly absolutePath: string; readonly relativePath: string }>,
) {
  const fs = yield* FileSystem.FileSystem
  const markdownSources: Array<MarkdownSourceFile> = []

  for (const file of markdownFiles) {
    markdownSources.push({
      relativePath: file.relativePath,
      source: yield* fs.readFileString(file.absolutePath),
    })
  }

  return markdownSources
})

export const runBuildGraph = Effect.fn("buildGraphCli.runBuildGraph")(function* ({
  from,
  to,
}: BuildGraphInput) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  yield* ensureDirectory("from", from)
  const toExistsAtStart = yield* fs.exists(to)
  if (toExistsAtStart) {
    yield* ensureDirectory("to", to)
  }

  const markdownFiles = yield* discoverMarkdownFiles(from)
  yield* Console.log(`Discovered ${markdownFiles.length} Markdown file(s)`)
  const markdownSources = yield* loadMarkdownSources(markdownFiles)
  const validatedNotes = yield* validateMarkdownSources(markdownSources)
  yield* Console.log(`Validated frontmatter for ${validatedNotes.length} Markdown file(s)`)
  const parsedWikilinks = validatedNotes.flatMap((note) =>
    parseWikilinks(note.body).map((wikilink) => ({
      ...wikilink,
      sourceRelativePath: note.relativePath,
    })),
  )
  yield* Console.log(`Parsed ${parsedWikilinks.length} wikilink(s)`)
  const snapshot = buildGraphSnapshot(validatedNotes, parsedWikilinks)
  if (snapshot.diagnostics.length > 0) {
    yield* Console.log(`Recorded ${snapshot.diagnostics.length} unresolved wikilink diagnostic(s)`)
  }

  if (!toExistsAtStart) {
    yield* fs.makeDirectory(to, { recursive: true })
  }

  const snapshotPath = path.join(to, GRAPH_SNAPSHOT_FILE_NAME)
  const snapshotExists = yield* fs.exists(snapshotPath)

  if (snapshotExists) {
    const backupPath = path.join(to, GRAPH_SNAPSHOT_BACKUP_FILE_NAME)
    const existingSnapshot = yield* fs.readFileString(snapshotPath)
    yield* fs.writeFileString(backupPath, existingSnapshot)
    yield* Console.log(`Backed up ${snapshotPath} to ${backupPath}`)
  }

  yield* fs.writeFileString(snapshotPath, serializeGraphSnapshot(snapshot))
  yield* Console.log(`Wrote ${snapshotPath}`)
})

export const buildGraphCommand = Command.make(
  "build-graph",
  {
    from: Argument.string("from").pipe(
      Argument.withDescription("Path to the source Markdown directory"),
    ),
    to: Argument.string("to").pipe(Argument.withDescription("Path to the destination directory")),
  },
  runBuildGraph,
).pipe(Command.withDescription("Build graph-snapshot.json from a Markdown source directory"))

export const runWithArgs = (args: ReadonlyArray<string>) =>
  Command.runWith(buildGraphCommand, { version: CLI_VERSION })(args).pipe(
    Effect.provide(NodeServices.layer),
  )

if (import.meta.main) {
  buildGraphCommand.pipe(
    Command.run({ version: CLI_VERSION }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  )
}
