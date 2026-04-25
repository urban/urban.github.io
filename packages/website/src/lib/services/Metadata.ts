import { Effect, Layer, Schema, ServiceMap } from "effect"
import { Essay, CollectionEntry, Project, NoteFrontmatter, Work } from "../schemas"
import { finalizeData, humanizeSlug, normalizeSlug } from "../note"
import type { NoteMetadataSeed } from "../note"

export class MetadataError extends Schema.TaggedErrorClass<MetadataError>()("MetadataError", {
  error: Schema.Unknown,
}) {}

export class Metadata extends ServiceMap.Service<Metadata>()("service/Metadata", {
  make: Effect.sync(() => {
    const decode =
      <S extends Schema.Top & { readonly DecodingServices: never }>(schema: S) =>
      (data: (typeof CollectionEntry.Type)["data"]) =>
        Schema.decodeEffect(schema)(data).pipe(
          Effect.mapError((error) => new MetadataError({ error: error.message })),
        )

    const decodeNote = (data: unknown) =>
      Schema.decodeUnknownEffect(NoteFrontmatter)(data).pipe(
        Effect.flatMap((frontmatter) => {
          const slug = normalizeSlug(frontmatter.permalink)
          if (slug === undefined) {
            return Effect.fail(
              new MetadataError({
                error: `Invalid permalink: ${frontmatter.permalink}`,
              }),
            )
          }

          const metadata: NoteMetadataSeed = {
            slug,
            permalink: frontmatter.permalink,
            title: frontmatter.title ?? humanizeSlug(slug),
            explicitDescription: frontmatter.description,
            createdAt: frontmatter.createdAt,
            updatedAt: frontmatter.updatedAt,
            aliases: frontmatter.aliases ?? [],
            published: frontmatter.published ?? true,
          }

          return Effect.succeed(metadata)
        }),
        Effect.mapError((error) => {
          if (error instanceof MetadataError) {
            return error
          }

          return new MetadataError({
            error: error instanceof Error ? error.message : String(error),
          })
        }),
      )

    return {
      essay: decode(Essay),
      project: decode(Project),
      work: decode(Work),
      seed: (data: unknown) => decodeNote(data),
      note: (data: unknown, excerpt: string | undefined) =>
        decodeNote(data).pipe(Effect.map((metadata) => finalizeData(metadata, excerpt))),
    }
  }),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
