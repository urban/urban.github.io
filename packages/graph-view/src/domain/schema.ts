import { Schema } from "effect"

export const GraphSnapshotResolutionStrategySchema = Schema.Union([
  Schema.Literal("path"),
  Schema.Literal("filename"),
  Schema.Literal("alias"),
  Schema.Literal("unresolved"),
])
export type GraphSnapshotResolutionStrategy = Schema.Schema.Type<
  typeof GraphSnapshotResolutionStrategySchema
>

export const GraphSnapshotNoteNodeSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("note"),
  relativePath: Schema.String,
  permalink: Schema.String,
  sourceRelativePath: Schema.optional(Schema.String),
  slug: Schema.optional(Schema.String),
  routePath: Schema.optional(Schema.String),
  label: Schema.optional(Schema.String),
  created: Schema.optional(Schema.String),
  updated: Schema.optional(Schema.String),
  aliases: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  published: Schema.optional(Schema.Boolean),
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NonEmptyString),
})
export type GraphSnapshotNoteNode = Schema.Schema.Type<typeof GraphSnapshotNoteNodeSchema>

export const GraphSnapshotPlaceholderNodeSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("placeholder"),
  unresolvedTarget: Schema.String,
})
export type GraphSnapshotPlaceholderNode = Schema.Schema.Type<
  typeof GraphSnapshotPlaceholderNodeSchema
>

export const GraphSnapshotNodeSchema = Schema.Union([
  GraphSnapshotNoteNodeSchema,
  GraphSnapshotPlaceholderNodeSchema,
])
export type GraphSnapshotNode = Schema.Schema.Type<typeof GraphSnapshotNodeSchema>

export const GraphSnapshotEdgeSchema = Schema.Struct({
  sourceNodeId: Schema.String,
  targetNodeId: Schema.String,
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  displayText: Schema.optional(Schema.String),
  resolutionStrategy: GraphSnapshotResolutionStrategySchema,
})
export type GraphSnapshotEdge = Schema.Schema.Type<typeof GraphSnapshotEdgeSchema>

export const UnresolvedWikilinkDiagnosticSchema = Schema.Struct({
  type: Schema.Literal("unresolved-wikilink"),
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  placeholderNodeId: Schema.String,
})
export type UnresolvedWikilinkDiagnostic = Schema.Schema.Type<
  typeof UnresolvedWikilinkDiagnosticSchema
>

export const GraphSnapshotSchemaVersionSchema = Schema.Literal("2")
export type GraphSnapshotSchemaVersion = Schema.Schema.Type<typeof GraphSnapshotSchemaVersionSchema>

export const GraphSnapshotIndexesSchema = Schema.Struct({
  nodesById: Schema.Record(Schema.String, GraphSnapshotNodeSchema),
  edgesBySourceNodeId: Schema.Record(Schema.String, Schema.Array(GraphSnapshotEdgeSchema)),
  edgesByTargetNodeId: Schema.Record(Schema.String, Schema.Array(GraphSnapshotEdgeSchema)),
  noteNodeIdBySlug: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  noteNodeIdByRoutePath: Schema.optional(Schema.Record(Schema.String, Schema.String)),
})
export type GraphSnapshotIndexes = Schema.Schema.Type<typeof GraphSnapshotIndexesSchema>

export const GraphSnapshotSchema = Schema.Struct({
  schemaVersion: GraphSnapshotSchemaVersionSchema,
  nodes: Schema.Array(GraphSnapshotNodeSchema),
  edges: Schema.Array(GraphSnapshotEdgeSchema),
  diagnostics: Schema.Array(UnresolvedWikilinkDiagnosticSchema),
  indexes: GraphSnapshotIndexesSchema,
})

export type GraphSnapshot = Schema.Schema.Type<typeof GraphSnapshotSchema>
