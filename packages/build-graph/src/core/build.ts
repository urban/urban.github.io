import { Graph, Schema } from "effect"
import {
  resolveWikilinkTargetV1,
  type ParsedWikilinkWithSource,
  type WikilinkResolverV1Index,
} from "./resolve"
import type { ValidatedMarkdownFile } from "./validate"

const compareStrings = (left: string, right: string) => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

const normalizeTargetForPlaceholder = (value: string): string =>
  value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/")
    .toLowerCase()

const toPlaceholderNodeId = (target: string): string => {
  const normalizedTarget = normalizeTargetForPlaceholder(target)
  return `placeholder:${normalizedTarget.length > 0 ? normalizedTarget : "unknown"}`
}

const GraphSnapshotNoteNodeSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("note"),
  relativePath: Schema.String,
  permalink: Schema.String,
})

const GraphSnapshotPlaceholderNodeSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("placeholder"),
  unresolvedTarget: Schema.String,
})

const GraphSnapshotEdgeSchema = Schema.Struct({
  sourceNodeId: Schema.String,
  targetNodeId: Schema.String,
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  displayText: Schema.optional(Schema.String),
  resolutionStrategy: Schema.Union([
    Schema.Literal("path"),
    Schema.Literal("filename"),
    Schema.Literal("alias"),
    Schema.Literal("unresolved"),
  ]),
})

const UnresolvedWikilinkDiagnosticSchema = Schema.Struct({
  type: Schema.Literal("unresolved-wikilink"),
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  placeholderNodeId: Schema.String,
})

const GraphSnapshotSchema = Schema.Struct({
  nodes: Schema.Array(
    Schema.Union([GraphSnapshotNoteNodeSchema, GraphSnapshotPlaceholderNodeSchema]),
  ),
  edges: Schema.Array(GraphSnapshotEdgeSchema),
  diagnostics: Schema.Array(UnresolvedWikilinkDiagnosticSchema),
})

export type GraphSnapshotNoteNode = Schema.Schema.Type<typeof GraphSnapshotNoteNodeSchema>
export type GraphSnapshotPlaceholderNode = Schema.Schema.Type<
  typeof GraphSnapshotPlaceholderNodeSchema
>
export type GraphSnapshotNode = GraphSnapshotNoteNode | GraphSnapshotPlaceholderNode
export type GraphSnapshotEdge = Schema.Schema.Type<typeof GraphSnapshotEdgeSchema>
export type UnresolvedWikilinkDiagnostic = Schema.Schema.Type<
  typeof UnresolvedWikilinkDiagnosticSchema
>
export type GraphSnapshot = Schema.Schema.Type<typeof GraphSnapshotSchema>

const createWikilinkEdge = (
  sourceNodeId: string,
  targetNodeId: string,
  wikilink: ParsedWikilinkWithSource,
  resolutionStrategy: "path" | "filename" | "alias" | "unresolved",
): GraphSnapshotEdge =>
  wikilink.displayText === undefined
    ? {
        sourceNodeId,
        targetNodeId,
        sourceRelativePath: wikilink.sourceRelativePath,
        rawWikilink: wikilink.raw,
        target: wikilink.target,
        resolutionStrategy,
      }
    : {
        sourceNodeId,
        targetNodeId,
        sourceRelativePath: wikilink.sourceRelativePath,
        rawWikilink: wikilink.raw,
        target: wikilink.target,
        displayText: wikilink.displayText,
        resolutionStrategy,
      }

const normalizeSnapshot = (snapshot: GraphSnapshot): GraphSnapshot => ({
  nodes: [...snapshot.nodes].sort((left, right) => compareStrings(left.id, right.id)),
  edges: [...snapshot.edges].sort((left, right) => {
    const sourceComparison = compareStrings(left.sourceNodeId, right.sourceNodeId)
    if (sourceComparison !== 0) {
      return sourceComparison
    }

    const targetComparison = compareStrings(left.targetNodeId, right.targetNodeId)
    if (targetComparison !== 0) {
      return targetComparison
    }

    return compareStrings(left.rawWikilink, right.rawWikilink)
  }),
  diagnostics: [...snapshot.diagnostics].sort((left, right) => {
    const sourceComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
    if (sourceComparison !== 0) {
      return sourceComparison
    }

    return compareStrings(left.rawWikilink, right.rawWikilink)
  }),
})

export const buildGraphSnapshot = (
  notes: ReadonlyArray<ValidatedMarkdownFile>,
  resolverV1Index: WikilinkResolverV1Index,
  wikilinks: ReadonlyArray<ParsedWikilinkWithSource>,
): GraphSnapshot => {
  const noteNodeIds = new Map<string, string>()
  const nodeIndices = new Map<string, number>()
  const diagnostics: Array<UnresolvedWikilinkDiagnostic> = []
  const placeholderByNormalizedTarget = new Map<
    string,
    { readonly nodeId: string; readonly nodeIndex: number }
  >()

  const graph = Graph.directed<GraphSnapshotNode, GraphSnapshotEdge>((mutable) => {
    for (const note of [...notes].sort((left, right) =>
      compareStrings(left.relativePath, right.relativePath),
    )) {
      const nodeId = note.relativePath
      const nodeIndex = Graph.addNode(mutable, {
        id: nodeId,
        kind: "note",
        relativePath: note.relativePath,
        permalink: note.frontmatter.permalink,
      })
      noteNodeIds.set(note.relativePath, nodeId)
      nodeIndices.set(nodeId, nodeIndex)
    }

    for (const wikilink of wikilinks) {
      const sourceNodeId = noteNodeIds.get(wikilink.sourceRelativePath)
      if (sourceNodeId === undefined) {
        continue
      }

      const sourceNodeIndex = nodeIndices.get(sourceNodeId)
      if (sourceNodeIndex === undefined) {
        continue
      }

      const resolution = resolveWikilinkTargetV1(resolverV1Index, wikilink.target)
      if (resolution.candidates.length > 1) {
        continue
      }

      if (resolution.candidates.length === 1) {
        const targetRelativePath = resolution.candidates[0]?.relativePath
        if (targetRelativePath === undefined) {
          continue
        }

        const targetNodeId = noteNodeIds.get(targetRelativePath)
        if (targetNodeId === undefined) {
          continue
        }

        const targetNodeIndex = nodeIndices.get(targetNodeId)
        if (targetNodeIndex === undefined) {
          continue
        }

        Graph.addEdge(
          mutable,
          sourceNodeIndex,
          targetNodeIndex,
          createWikilinkEdge(sourceNodeId, targetNodeId, wikilink, resolution.strategy),
        )

        continue
      }

      const normalizedTarget = normalizeTargetForPlaceholder(wikilink.target)
      const existingPlaceholder = placeholderByNormalizedTarget.get(normalizedTarget)
      if (existingPlaceholder !== undefined) {
        Graph.addEdge(
          mutable,
          sourceNodeIndex,
          existingPlaceholder.nodeIndex,
          createWikilinkEdge(sourceNodeId, existingPlaceholder.nodeId, wikilink, "unresolved"),
        )
        diagnostics.push({
          type: "unresolved-wikilink",
          sourceRelativePath: wikilink.sourceRelativePath,
          rawWikilink: wikilink.raw,
          target: wikilink.target,
          placeholderNodeId: existingPlaceholder.nodeId,
        })
        continue
      }

      const placeholderNodeId = toPlaceholderNodeId(wikilink.target)
      const placeholderNodeIndex = Graph.addNode(mutable, {
        id: placeholderNodeId,
        kind: "placeholder",
        unresolvedTarget: normalizedTarget,
      })
      placeholderByNormalizedTarget.set(normalizedTarget, {
        nodeId: placeholderNodeId,
        nodeIndex: placeholderNodeIndex,
      })

      Graph.addEdge(
        mutable,
        sourceNodeIndex,
        placeholderNodeIndex,
        createWikilinkEdge(sourceNodeId, placeholderNodeId, wikilink, "unresolved"),
      )

      diagnostics.push({
        type: "unresolved-wikilink",
        sourceRelativePath: wikilink.sourceRelativePath,
        rawWikilink: wikilink.raw,
        target: wikilink.target,
        placeholderNodeId: placeholderNodeId,
      })
    }
  })

  return normalizeSnapshot({
    nodes: [...graph.nodes.values()],
    edges: [...graph.edges.values()].map((edge) => edge.data),
    diagnostics,
  })
}

export const serializeGraphSnapshot = (snapshot: GraphSnapshot): string =>
  `${JSON.stringify(snapshot, null, 2)}\n`
