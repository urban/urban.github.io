import { Schema } from "effect"

export const Work = Schema.Struct({
  company: Schema.String,
  role: Schema.String,
  location: Schema.String,
  locationType: Schema.Literal("On-Site", "Remote", "Hybrid"),
  dateStart: Schema.Date,
  dateEnd: Schema.Union(Schema.Date, Schema.Literal("Present")),
})

export const Article = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  date: Schema.Date,
  updatedAt: Schema.Date,
  draft: Schema.optional(Schema.Boolean),
})

export const Project = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  date: Schema.Date,
  draft: Schema.optional(Schema.Boolean),
  demoURL: Schema.optional(Schema.String),
  repoURL: Schema.optional(Schema.String),
})

export const CollectionEntry = Schema.Struct({
  source: Schema.String,
  data: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  filepath: Schema.String,
  slug: Schema.String,
})

export const VFileData = Schema.Struct({
  filepath: Schema.String,
})
