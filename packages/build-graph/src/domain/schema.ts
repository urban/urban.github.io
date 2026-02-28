import { Schema } from "effect"

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const isLeapYear = (year: number): boolean =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

const isValidIsoDateOnly = (value: string): boolean => {
  if (!ISO_DATE_ONLY.test(value)) {
    return false
  }

  const [yearRaw, monthRaw, dayRaw] = value.split("-")
  const year = Number.parseInt(yearRaw, 10)
  const month = Number.parseInt(monthRaw, 10)
  const day = Number.parseInt(dayRaw, 10)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }

  if (month < 1 || month > 12) {
    return false
  }

  return day >= 1 && day <= daysInMonth(year, month)
}

export const IsoDateOnlyString = Schema.String.pipe(
  Schema.refine((value): value is string => isValidIsoDateOnly(value), {
    identifier: "IsoDateOnlyString",
    description: "Semantically valid ISO date-only string in YYYY-MM-DD format",
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

export const GraphSnapshotResolutionStrategySchema = Schema.Union([
  Schema.Literal("path"),
  Schema.Literal("filename"),
  Schema.Literal("alias"),
  Schema.Literal("unresolved"),
])

export const GraphSnapshotNoteNodeSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("note"),
  relativePath: Schema.String,
  permalink: Schema.String,
})

export const GraphSnapshotPlaceholderNodeSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("placeholder"),
  unresolvedTarget: Schema.String,
})

export const GraphSnapshotNodeSchema = Schema.Union([
  GraphSnapshotNoteNodeSchema,
  GraphSnapshotPlaceholderNodeSchema,
])

export const GraphSnapshotEdgeSchema = Schema.Struct({
  sourceNodeId: Schema.String,
  targetNodeId: Schema.String,
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  displayText: Schema.optional(Schema.String),
  resolutionStrategy: GraphSnapshotResolutionStrategySchema,
})

export const UnresolvedWikilinkDiagnosticSchema = Schema.Struct({
  type: Schema.Literal("unresolved-wikilink"),
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  placeholderNodeId: Schema.String,
})

export const GraphSnapshotSchema = Schema.Struct({
  nodes: Schema.Array(GraphSnapshotNodeSchema),
  edges: Schema.Array(GraphSnapshotEdgeSchema),
  diagnostics: Schema.Array(UnresolvedWikilinkDiagnosticSchema),
})

export type GraphSnapshotResolutionStrategy = Schema.Schema.Type<
  typeof GraphSnapshotResolutionStrategySchema
>
export type GraphSnapshotNoteNode = Schema.Schema.Type<typeof GraphSnapshotNoteNodeSchema>
export type GraphSnapshotPlaceholderNode = Schema.Schema.Type<
  typeof GraphSnapshotPlaceholderNodeSchema
>
export type GraphSnapshotNode = Schema.Schema.Type<typeof GraphSnapshotNodeSchema>
export type GraphSnapshotEdge = Schema.Schema.Type<typeof GraphSnapshotEdgeSchema>
export type UnresolvedWikilinkDiagnostic = Schema.Schema.Type<
  typeof UnresolvedWikilinkDiagnosticSchema
>
export type GraphSnapshot = Schema.Schema.Type<typeof GraphSnapshotSchema>

export const normalizeRawNoteFrontmatter = (frontmatter: RawNoteFrontmatter): NoteFrontmatter => ({
  permalink: frontmatter.permalink,
  created: frontmatter.created,
  updated: frontmatter.updated,
  aliases: frontmatter.aliases ?? [],
  published: frontmatter.published ?? true,
})
