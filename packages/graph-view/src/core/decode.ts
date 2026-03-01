import { Effect, Schema } from "effect"
import { GraphSnapshotSchema, type GraphSnapshot } from "../domain/schema"

export type GraphViewSnapshotInput = GraphSnapshot | string

export class GraphViewJsonParseError extends Schema.TaggedErrorClass<GraphViewJsonParseError>()(
  "GraphViewJsonParseError",
  {
    message: Schema.String,
    error: Schema.Unknown,
  },
) {}

export class GraphViewSnapshotValidationError extends Schema.TaggedErrorClass<GraphViewSnapshotValidationError>()(
  "GraphViewSnapshotValidationError",
  {
    error: Schema.Unknown,
  },
) {}

const decodeUnknownGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

export const decodeGraphSnapshot = (input: GraphViewSnapshotInput) =>
  Effect.gen(function* () {
    const unknownSnapshot = yield* Effect.try({
      try: () => (typeof input === "string" ? JSON.parse(input) : input),
      catch: (error) =>
        new GraphViewJsonParseError({
          message: "Failed to parse graph snapshot JSON input",
          error,
        }),
    })

    return yield* Effect.try({
      try: () => decodeUnknownGraphSnapshot(unknownSnapshot),
      catch: (error) => new GraphViewSnapshotValidationError({ error }),
    })
  })
