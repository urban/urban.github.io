import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, Path, Schema } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { decodeGraphSnapshot } from "../core/decode"
import { renderMarkdownFromSnapshot } from "../core/render-markdown"

const CLI_VERSION = "0.0.0"

export type GraphViewInput = {
  readonly from: string
  readonly to: string
}

export class GraphViewCliValidationError extends Schema.TaggedErrorClass<GraphViewCliValidationError>()(
  "GraphViewCliValidationError",
  {
    message: Schema.String,
  },
) {}

export class GraphViewCliReadError extends Schema.TaggedErrorClass<GraphViewCliReadError>()(
  "GraphViewCliReadError",
  {
    path: Schema.String,
    message: Schema.String,
    error: Schema.Unknown,
  },
) {}

export class GraphViewCliWriteError extends Schema.TaggedErrorClass<GraphViewCliWriteError>()(
  "GraphViewCliWriteError",
  {
    path: Schema.String,
    message: Schema.String,
    error: Schema.Unknown,
  },
) {}

const ensureFile = Effect.fn("graphViewCli.ensureFile")(function* (path: string) {
  const fs = yield* FileSystem.FileSystem
  const exists = yield* fs.exists(path)

  if (!exists) {
    return yield* new GraphViewCliValidationError({
      message: `Invalid from file: ${path} does not exist`,
    })
  }

  const stat = yield* fs.stat(path)
  if (stat.type !== "File") {
    return yield* new GraphViewCliValidationError({
      message: `Invalid from file: ${path} is not a file`,
    })
  }
})

const ensureOutputPath = Effect.fn("graphViewCli.ensureOutputPath")(function* (path: string) {
  const fs = yield* FileSystem.FileSystem
  const pathService = yield* Path.Path
  const parentDirectory = pathService.dirname(path)
  const parentExists = yield* fs.exists(parentDirectory)

  if (parentExists) {
    const parentStat = yield* fs.stat(parentDirectory)
    if (parentStat.type !== "Directory") {
      return yield* new GraphViewCliValidationError({
        message: `Invalid to output directory: ${parentDirectory} is not a directory`,
      })
    }
  }

  const fileExists = yield* fs.exists(path)

  if (fileExists) {
    const outputStat = yield* fs.stat(path)
    if (outputStat.type !== "File") {
      return yield* new GraphViewCliValidationError({
        message: `Invalid to output file: ${path} is not a file`,
      })
    }
  }
})

export const runGraphView = Effect.fn("graphViewCli.runGraphView")(function* ({
  from,
  to,
}: GraphViewInput) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  yield* ensureFile(from)
  yield* ensureOutputPath(to)

  const snapshotText = yield* fs.readFileString(from).pipe(
    Effect.mapError(
      (error) =>
        new GraphViewCliReadError({
          path: from,
          message: `Failed to read graph snapshot from ${from}`,
          error,
        }),
    ),
  )
  const snapshot = yield* decodeGraphSnapshot(snapshotText)
  const markdown = renderMarkdownFromSnapshot(snapshot)

  yield* fs.makeDirectory(path.dirname(to), { recursive: true }).pipe(
    Effect.mapError(
      (error) =>
        new GraphViewCliWriteError({
          path: to,
          message: `Failed to prepare output directory for ${to}`,
          error,
        }),
    ),
  )
  yield* fs.writeFileString(to, markdown).pipe(
    Effect.mapError(
      (error) =>
        new GraphViewCliWriteError({
          path: to,
          message: `Failed to write graph markdown to ${to}`,
          error,
        }),
    ),
  )
})

export const graphViewCommand = Command.make(
  "graph-view",
  {
    from: Argument.string("from").pipe(Argument.withDescription("Path to the graph snapshot JSON")),
    to: Argument.string("to").pipe(
      Argument.withDescription("Path to the destination Markdown file"),
    ),
  },
  runGraphView,
).pipe(Command.withDescription("Render graph snapshot JSON to Markdown with Mermaid"))

export const runWithArgs = (args: ReadonlyArray<string>) =>
  Command.runWith(graphViewCommand, { version: CLI_VERSION })(args).pipe(
    Effect.provide(BunServices.layer),
  )

if (import.meta.main) {
  graphViewCommand.pipe(
    Command.run({ version: CLI_VERSION }),
    Effect.provide(BunServices.layer),
    BunRuntime.runMain,
  )
}
