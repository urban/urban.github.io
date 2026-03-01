import { Schema } from "effect"
import {
  GraphSnapshotEdgeSchema,
  GraphSnapshotNodeSchema,
  GraphSnapshotSchema,
  UnresolvedWikilinkDiagnosticSchema,
  type GraphSnapshot,
  type GraphSnapshotEdge,
  type GraphSnapshotNode,
  type UnresolvedWikilinkDiagnostic,
} from "../domain/schema"
import { compareStrings } from "./helpers"

const decodeGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

type GraphSnapshotArrays = Readonly<{
  readonly nodes: ReadonlyArray<GraphSnapshotNode>
  readonly edges: ReadonlyArray<GraphSnapshotEdge>
  readonly diagnostics: ReadonlyArray<UnresolvedWikilinkDiagnostic>
}>

const GraphSnapshotArraysSchema = Schema.Struct({
  nodes: Schema.Array(GraphSnapshotNodeSchema),
  edges: Schema.Array(GraphSnapshotEdgeSchema),
  diagnostics: Schema.Array(UnresolvedWikilinkDiagnosticSchema),
})

const decodeGraphSnapshotArrays = Schema.decodeUnknownSync(GraphSnapshotArraysSchema)

const toSortedRecord = <T>(
  entries: ReadonlyArray<readonly [key: string, value: T]>,
): Record<string, T> =>
  Object.fromEntries([...entries].sort((left, right) => compareStrings(left[0], right[0])))

const groupEdgesByNodeId = (
  edges: ReadonlyArray<GraphSnapshotEdge>,
  selectNodeId: (edge: GraphSnapshotEdge) => string,
): Record<string, ReadonlyArray<GraphSnapshotEdge>> => {
  const grouped = new Map<string, Array<GraphSnapshotEdge>>()

  for (const edge of edges) {
    const nodeId = selectNodeId(edge)
    const existingEdges = grouped.get(nodeId)
    if (existingEdges === undefined) {
      grouped.set(nodeId, [edge])
      continue
    }
    existingEdges.push(edge)
  }

  return toSortedRecord([...grouped.entries()])
}

export const normalizeGraphSnapshot = (snapshot: GraphSnapshotArrays): GraphSnapshot => {
  const nodes = [...snapshot.nodes].sort((left, right) => {
    const idComparison = compareStrings(left.id, right.id)
    if (idComparison !== 0) {
      return idComparison
    }

    return compareStrings(left.kind, right.kind)
  })

  const edges = [...snapshot.edges].sort((left, right) => {
    const sourceNodeComparison = compareStrings(left.sourceNodeId, right.sourceNodeId)
    if (sourceNodeComparison !== 0) {
      return sourceNodeComparison
    }

    const targetNodeComparison = compareStrings(left.targetNodeId, right.targetNodeId)
    if (targetNodeComparison !== 0) {
      return targetNodeComparison
    }

    const rawWikilinkComparison = compareStrings(left.rawWikilink, right.rawWikilink)
    if (rawWikilinkComparison !== 0) {
      return rawWikilinkComparison
    }

    const sourcePathComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
    if (sourcePathComparison !== 0) {
      return sourcePathComparison
    }

    const targetComparison = compareStrings(left.target, right.target)
    if (targetComparison !== 0) {
      return targetComparison
    }

    const resolutionComparison = compareStrings(left.resolutionStrategy, right.resolutionStrategy)
    if (resolutionComparison !== 0) {
      return resolutionComparison
    }

    return compareStrings(left.displayText ?? "", right.displayText ?? "")
  })

  const diagnostics = [...snapshot.diagnostics].sort((left, right) => {
    const sourceComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
    if (sourceComparison !== 0) {
      return sourceComparison
    }

    const rawWikilinkComparison = compareStrings(left.rawWikilink, right.rawWikilink)
    if (rawWikilinkComparison !== 0) {
      return rawWikilinkComparison
    }

    const targetComparison = compareStrings(left.target, right.target)
    if (targetComparison !== 0) {
      return targetComparison
    }

    return compareStrings(left.placeholderNodeId, right.placeholderNodeId)
  })

  return {
    schemaVersion: "2",
    nodes,
    edges,
    diagnostics,
    indexes: {
      nodesById: toSortedRecord(nodes.map((node) => [node.id, node] as const)),
      edgesBySourceNodeId: groupEdgesByNodeId(edges, (edge) => edge.sourceNodeId),
      edgesByTargetNodeId: groupEdgesByNodeId(edges, (edge) => edge.targetNodeId),
    },
  }
}

export const serializeGraphSnapshot = (snapshot: unknown): string => {
  const normalizedSnapshot = normalizeGraphSnapshot(decodeGraphSnapshotArrays(snapshot))
  const contractSnapshot = decodeGraphSnapshot(normalizedSnapshot)
  return `${JSON.stringify(contractSnapshot, null, 2)}\n`
}
