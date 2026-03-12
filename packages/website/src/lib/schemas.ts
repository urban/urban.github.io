import { Schema, SchemaGetter } from "effect"

const DateFromString = Schema.Date.pipe(
  Schema.encodeTo(Schema.String, {
    decode: SchemaGetter.Date(),
    encode: SchemaGetter.String(),
  }),
)

const DateFromFrontmatter = Schema.Union([DateFromString, Schema.Date])

export const Work = Schema.Struct({
  company: Schema.String,
  role: Schema.String,
  location: Schema.String,
  locationType: Schema.Literals(["On-Site", "Remote", "Hybrid"]),
  dateStart: DateFromString,
  dateEnd: Schema.Union([DateFromString, Schema.Literal("Present")]),
})

export const Article = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  date: DateFromString,
  updatedAt: DateFromString,
  draft: Schema.optional(Schema.Boolean),
})

export const Project = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  date: DateFromString,
  draft: Schema.optional(Schema.Boolean),
  demoURL: Schema.optional(Schema.String),
  repoURL: Schema.optional(Schema.String),
})

export const VaultFrontmatter = Schema.Struct({
  permalink: Schema.NonEmptyString,
  created: DateFromFrontmatter,
  updated: DateFromFrontmatter,
  aliases: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  published: Schema.optional(Schema.Boolean),
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NonEmptyString),
})

export const CompiledVFileData = Schema.Struct({
  filepath: Schema.String,
  descriptionExcerpt: Schema.optional(Schema.String),
})

export const CollectionEntry = Schema.Struct({
  source: Schema.String,
  data: Schema.Record(Schema.String, Schema.Unknown),
  filepath: Schema.String,
  slug: Schema.String,
})

export const VFileData = Schema.Struct({
  filepath: Schema.String,
})
