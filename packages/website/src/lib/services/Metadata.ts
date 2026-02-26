import { Effect, Layer, Schema, ServiceMap } from "effect"
import { Article, Project, Work } from "@/lib/schemas"
import { CollectionEntry } from "@/lib/schemas"

export class MetadataError extends Schema.TaggedErrorClass<MetadataError>()("MetadataError", {
  error: Schema.Unknown,
}) {}

export class Metadata extends ServiceMap.Service<Metadata>()("service/Metadata", {
  make: Effect.sync(() => {
    const decode =
      <S extends Schema.Top & { readonly DecodingServices: never }>(schema: S) =>
      (data: (typeof CollectionEntry.Type)["data"]) =>
        Schema.decodeEffect(schema)(data).pipe(
          Effect.mapError((error) => {
            console.log(error)
            return new MetadataError({ error: error.message })
          }),
        )

    return {
      article: decode(Article),
      project: decode(Project),
      work: decode(Work),
    }
  }),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
