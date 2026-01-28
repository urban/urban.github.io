import { Data, Effect, Schema } from "effect"
import { Article, Project, Work } from "@/lib/schemas"
import { CollectionEntry } from "@/lib/schemas"

class MetadataError extends Data.TaggedError("MetadataError")<{
  error: unknown
}> {}

class Metadata extends Effect.Service<Metadata>()("service/Metadata", {
  dependencies: [],
  sync: () => {
    const decode =
      <A, I, R>(schema: Schema.Schema<A, I, R>) =>
      (data: (typeof CollectionEntry.Type)["data"]) =>
        Schema.decodeUnknown(schema)(data).pipe(
          Effect.mapError((error) => new MetadataError({ error })),
        )

    return {
      article: decode(Article),
      project: decode(Project),
      work: decode(Work),
    }
  },
}) {}

export { Metadata, MetadataError }
