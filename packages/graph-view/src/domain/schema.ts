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

export const GraphSnapshotSchema = Schema.Struct({
  nodes: Schema.Array(GraphSnapshotNodeSchema),
  edges: Schema.Array(GraphSnapshotEdgeSchema),
  diagnostics: Schema.Array(UnresolvedWikilinkDiagnosticSchema),
})

export type GraphSnapshot = Schema.Schema.Type<typeof GraphSnapshotSchema>
