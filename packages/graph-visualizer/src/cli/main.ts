import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect, FileSystem, Path, Schema } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { decodeGraphSnapshot } from "../core/decode"
import { renderHtmlFromSnapshot } from "../core/render-html"

const CLI_VERSION = "0.0.0"

export type GraphVisualizerInput = {
  readonly from: string
  readonly to: string
}

export class GraphVisualizerCliValidationError extends Schema.TaggedErrorClass<GraphVisualizerCliValidationError>()(
  "GraphVisualizerCliValidationError",
  {
    message: Schema.String,
  },
) {}

const ensureFile = Effect.fn("graphVisualizerCli.ensureFile")(function* (path: string) {
  const fs = yield* FileSystem.FileSystem
  const exists = yield* fs.exists(path)

  if (!exists) {
    return yield* new GraphVisualizerCliValidationError({
      message: `Invalid from file: ${path} does not exist`,
    })
  }

  const stat = yield* fs.stat(path)
  if (stat.type !== "File") {
    return yield* new GraphVisualizerCliValidationError({
      message: `Invalid from file: ${path} is not a file`,
    })
  }
})

const ensureOutputPath = Effect.fn("graphVisualizerCli.ensureOutputPath")(function* (path: string) {
  const fs = yield* FileSystem.FileSystem
  const pathService = yield* Path.Path
  const parentDirectory = pathService.dirname(path)
  const parentExists = yield* fs.exists(parentDirectory)

  if (parentExists) {
    const parentStat = yield* fs.stat(parentDirectory)
    if (parentStat.type !== "Directory") {
      return yield* new GraphVisualizerCliValidationError({
        message: `Invalid to output directory: ${parentDirectory} is not a directory`,
      })
    }
  }

  const fileExists = yield* fs.exists(path)

  if (fileExists) {
    const outputStat = yield* fs.stat(path)
    if (outputStat.type !== "File") {
      return yield* new GraphVisualizerCliValidationError({
        message: `Invalid to output file: ${path} is not a file`,
      })
    }
  }
})

export const runGraphVisualizer = Effect.fn("graphVisualizerCli.runGraphVisualizer")(function* ({
  from,
  to,
}: GraphVisualizerInput) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  yield* ensureFile(from)
  yield* ensureOutputPath(to)

  const snapshotText = yield* fs.readFileString(from)
  const snapshot = yield* decodeGraphSnapshot(snapshotText)
  const html = renderHtmlFromSnapshot(snapshot)

  yield* fs.makeDirectory(path.dirname(to), { recursive: true })
  yield* fs.writeFileString(to, html)
})

export const graphVisualizerCommand = Command.make(
  "graph-visualizer",
  {
    from: Argument.string("from").pipe(Argument.withDescription("Path to the graph snapshot JSON")),
    to: Argument.string("to").pipe(Argument.withDescription("Path to the destination HTML file")),
  },
  runGraphVisualizer,
).pipe(Command.withDescription("Render graph snapshot JSON to standalone HTML"))

export const runWithArgs = (args: ReadonlyArray<string>) =>
  Command.runWith(graphVisualizerCommand, { version: CLI_VERSION })(args).pipe(
    Effect.provide(NodeServices.layer),
  )

if (import.meta.main) {
  graphVisualizerCommand.pipe(
    Command.run({ version: CLI_VERSION }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  )
}
