import { Effect, Layer, Schema, ServiceMap } from "effect"
import { Essay, CollectionEntry, Project, VaultFrontmatter, Work } from "../schemas"
import { finalizeVaultData, humanizeVaultSlug, normalizeVaultSlug } from "../vault"
import type { VaultMetadataSeed } from "../vault"

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

    const decodeVault = (data: unknown) =>
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

          const metadata: VaultMetadataSeed = {
            slug,
            permalink: frontmatter.permalink,
            title: frontmatter.title ?? humanizeVaultSlug(slug),
            explicitDescription: frontmatter.description,
            createdAt: frontmatter.createdAt,
            updatedAt: frontmatter.updatedAt,
            aliases: frontmatter.aliases ?? [],
            published: frontmatter.published ?? true,
          }

          return Effect.succeed(metadata)
        }),
        Effect.mapError((error) => {
          console.log(error)
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
      vaultSeed: (data: unknown) => decodeVault(data),
      vault: (data: unknown, excerpt: string | undefined) =>
        decodeVault(data).pipe(Effect.map((metadata) => finalizeVaultData(metadata, excerpt))),
    }
  }),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
