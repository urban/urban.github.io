import { Schema, SchemaGetter } from "effect"

const DateFromString = Schema.Date.pipe(
  Schema.encodeTo(Schema.String, {
    decode: SchemaGetter.Date(),
    encode: SchemaGetter.String(),
  }),
)

// gray-matter parses bare YAML dates as Date instances instead of strings.
const DateTimeFromFrontmatter = Schema.Union([
  Schema.DateTimeUtcFromDate,
  Schema.DateTimeUtcFromString,
])

export const Work = Schema.Struct({
  company: Schema.String,
  role: Schema.String,
  location: Schema.String,
  locationType: Schema.Literals(["On-Site", "Remote", "Hybrid"]),
  dateStart: DateFromString,
  dateEnd: Schema.Union([DateFromString, Schema.Literal("Present")]),
})

export const Essay = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  createdAt: DateTimeFromFrontmatter,
  updatedAt: DateTimeFromFrontmatter,
  published: Schema.optional(Schema.Boolean),
})

export const Project = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  createdAt: DateTimeFromFrontmatter,
  updatedAt: DateTimeFromFrontmatter,
  demoURL: Schema.optional(Schema.String),
  repoURL: Schema.optional(Schema.String),
  published: Schema.optional(Schema.Boolean),
})

export const NoteFrontmatter = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NonEmptyString),
  permalink: Schema.NonEmptyString,
  createdAt: DateTimeFromFrontmatter,
  updatedAt: DateTimeFromFrontmatter,
  aliases: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  published: Schema.optional(Schema.Boolean),
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
