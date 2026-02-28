import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect, FileSystem, Path } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { renderMarkdownFromSnapshot } from "../core/render-markdown"
import type { GraphSnapshot } from "../domain/schema"

const CLI_VERSION = "0.0.0"

export type GraphViewInput = {
  readonly from: string
  readonly to: string
}

export const runGraphView = Effect.fn("graphViewCli.runGraphView")(function* ({
  from,
  to,
}: GraphViewInput) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const snapshotText = yield* fs.readFileString(from)
  const snapshot = JSON.parse(snapshotText) as GraphSnapshot
  const markdown = renderMarkdownFromSnapshot(snapshot)

  yield* fs.makeDirectory(path.dirname(to), { recursive: true })
  yield* fs.writeFileString(to, markdown)
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
    Effect.provide(NodeServices.layer),
  )

if (import.meta.main) {
  graphViewCommand.pipe(
    Command.run({ version: CLI_VERSION }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  )
}
