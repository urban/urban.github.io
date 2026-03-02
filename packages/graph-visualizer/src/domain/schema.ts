import { Schema } from "effect"

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

export const GraphSnapshotSchemaVersionSchema = Schema.Literal("2")

export const GraphSnapshotIndexesSchema = Schema.Struct({
  nodesById: Schema.Record(Schema.String, GraphSnapshotNodeSchema),
  edgesBySourceNodeId: Schema.Record(Schema.String, Schema.Array(GraphSnapshotEdgeSchema)),
  edgesByTargetNodeId: Schema.Record(Schema.String, Schema.Array(GraphSnapshotEdgeSchema)),
})

export const GraphSnapshotSchema = Schema.Struct({
  schemaVersion: GraphSnapshotSchemaVersionSchema,
  nodes: Schema.Array(GraphSnapshotNodeSchema),
  edges: Schema.Array(GraphSnapshotEdgeSchema),
  diagnostics: Schema.Array(UnresolvedWikilinkDiagnosticSchema),
  indexes: GraphSnapshotIndexesSchema,
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
export type GraphSnapshotSchemaVersion = Schema.Schema.Type<typeof GraphSnapshotSchemaVersionSchema>
export type GraphSnapshotIndexes = Schema.Schema.Type<typeof GraphSnapshotIndexesSchema>
export type GraphSnapshot = Schema.Schema.Type<typeof GraphSnapshotSchema>
