import { Effect, Layer, Schema, ServiceMap } from "effect"
import { Article, CollectionEntry, Project, VaultFrontmatter, Work } from "../schemas"
import { humanizeVaultSlug, normalizeVaultSlug, resolveVaultDescription } from "../vault"

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
      vault: (data: unknown, excerpt: string | undefined) =>
        Schema.decodeUnknownEffect(VaultFrontmatter)(data).pipe(
          Effect.flatMap((frontmatter) => {
            const slug = normalizeVaultSlug(frontmatter.permalink)
            if (slug === undefined) {
              return Effect.fail(
                new MetadataError({
                  error: `Invalid vault permalink: ${frontmatter.permalink}`,
                }),
              )
            }

            return Effect.succeed({
              slug,
              permalink: frontmatter.permalink,
              title: frontmatter.title ?? humanizeVaultSlug(slug),
              description: resolveVaultDescription(frontmatter.description, excerpt),
              created: frontmatter.created,
              updated: frontmatter.updated,
              aliases: frontmatter.aliases ?? [],
              published: frontmatter.published ?? true,
            })
          }),
          Effect.mapError((error) => {
            console.log(error)
            return new MetadataError({
              error: error instanceof Error ? error.message : String(error),
            })
          }),
        ),
    }
  }),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
