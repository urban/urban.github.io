import { Effect, Schema } from "effect"
import { GraphSnapshotSchema, type GraphSnapshot } from "../domain/schema"

export type GraphVisualizerSnapshotInput = GraphSnapshot | string

export class GraphVisualizerJsonParseError extends Schema.TaggedErrorClass<GraphVisualizerJsonParseError>()(
  "GraphVisualizerJsonParseError",
  {
    message: Schema.String,
    error: Schema.Unknown,
  },
) {}

export class GraphVisualizerSnapshotValidationError extends Schema.TaggedErrorClass<GraphVisualizerSnapshotValidationError>()(
  "GraphVisualizerSnapshotValidationError",
  {
    error: Schema.Unknown,
  },
) {}

const decodeUnknownGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

export const decodeGraphSnapshot = (input: GraphVisualizerSnapshotInput) =>
  Effect.gen(function* () {
    const unknownSnapshot = yield* Effect.try({
      try: () => (typeof input === "string" ? JSON.parse(input) : input),
      catch: (error) =>
        new GraphVisualizerJsonParseError({
          message: "Failed to parse graph snapshot JSON input",
          error,
        }),
    })

    return yield* Effect.try({
      try: () => decodeUnknownGraphSnapshot(unknownSnapshot),
      catch: (error) => new GraphVisualizerSnapshotValidationError({ error }),
    })
  })
