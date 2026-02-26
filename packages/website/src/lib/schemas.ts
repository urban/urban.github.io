import { Schema, SchemaGetter } from "effect"

const DateFromString = Schema.Date.pipe(
  Schema.encodeTo(Schema.String, {
    decode: SchemaGetter.Date(),
    encode: SchemaGetter.String(),
  }),
)

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

export const CollectionEntry = Schema.Struct({
  source: Schema.String,
  data: Schema.Record(Schema.String, Schema.Unknown),
  filepath: Schema.String,
  slug: Schema.String,
})

export const VFileData = Schema.Struct({
  filepath: Schema.String,
})
