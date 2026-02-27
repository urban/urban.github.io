import { Schema } from "effect"

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export const IsoDateOnlyString = Schema.String.pipe(
  Schema.refine((value): value is string => ISO_DATE_ONLY.test(value), {
    identifier: "IsoDateOnlyString",
    description: "ISO date-only string in YYYY-MM-DD format",
  }),
)

export const RawNoteFrontmatterSchema = Schema.Struct({
  permalink: Schema.NonEmptyString,
  created: IsoDateOnlyString,
  updated: IsoDateOnlyString,
  aliases: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  published: Schema.optional(Schema.Boolean),
})

export type RawNoteFrontmatter = Schema.Schema.Type<typeof RawNoteFrontmatterSchema>

export const NoteFrontmatterSchema = Schema.Struct({
  permalink: Schema.NonEmptyString,
  created: IsoDateOnlyString,
  updated: IsoDateOnlyString,
  aliases: Schema.Array(Schema.NonEmptyString),
  published: Schema.Boolean,
})

export type NoteFrontmatter = Schema.Schema.Type<typeof NoteFrontmatterSchema>

export const normalizeRawNoteFrontmatter = (frontmatter: RawNoteFrontmatter): NoteFrontmatter => ({
  permalink: frontmatter.permalink,
  created: frontmatter.created,
  updated: frontmatter.updated,
  aliases: frontmatter.aliases ?? [],
  published: frontmatter.published ?? true,
})
