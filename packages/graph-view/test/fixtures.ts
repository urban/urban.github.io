import type {
  GraphSnapshot,
  GraphSnapshotEdge,
  GraphSnapshotNode,
  UnresolvedWikilinkDiagnostic,
} from "../src/domain/schema"

type MakeGraphSnapshotInput = {
  readonly nodes: ReadonlyArray<GraphSnapshotNode>
  readonly edges?: ReadonlyArray<GraphSnapshotEdge>
  readonly diagnostics?: ReadonlyArray<UnresolvedWikilinkDiagnostic>
}

const pushEdgeIntoRecord = (
  record: Record<string, Array<GraphSnapshotEdge>>,
  key: string,
  edge: GraphSnapshotEdge,
): void => {
  const existing = record[key]
  if (existing === undefined) {
    record[key] = [edge]
    return
  }

  existing.push(edge)
}

const buildNodeRecord = (
  nodes: ReadonlyArray<GraphSnapshotNode>,
): Record<string, GraphSnapshotNode> => {
  const nodesById: Record<string, GraphSnapshotNode> = {}

  for (const node of nodes) {
    nodesById[node.id] = node
  }

  return nodesById
}

const buildEdgeRecord = (
  edges: ReadonlyArray<GraphSnapshotEdge>,
  selectKey: (edge: GraphSnapshotEdge) => string,
): Record<string, Array<GraphSnapshotEdge>> => {
  const record: Record<string, Array<GraphSnapshotEdge>> = {}

  for (const edge of edges) {
    pushEdgeIntoRecord(record, selectKey(edge), edge)
  }

  return record
}

const buildOptionalNoteLookup = (
  nodes: ReadonlyArray<GraphSnapshotNode>,
  selectKey: (node: Extract<GraphSnapshotNode, { kind: "note" }>) => string | undefined,
): Record<string, string> => {
  const record: Record<string, string> = {}

  for (const node of nodes) {
    if (node.kind !== "note") {
      continue
    }

    const key = selectKey(node)
    if (key !== undefined) {
      record[key] = node.id
    }
  }

  return record
}

export const makeGraphSnapshot = ({
  nodes,
  edges = [],
  diagnostics = [],
}: MakeGraphSnapshotInput): GraphSnapshot => ({
  schemaVersion: "2",
  nodes: [...nodes],
  edges: [...edges],
  diagnostics: [...diagnostics],
  indexes: {
    nodesById: buildNodeRecord(nodes),
    edgesBySourceNodeId: buildEdgeRecord(edges, (edge) => edge.sourceNodeId),
    edgesByTargetNodeId: buildEdgeRecord(edges, (edge) => edge.targetNodeId),
    noteNodeIdBySlug: buildOptionalNoteLookup(nodes, (node) => node.slug),
    noteNodeIdByRoutePath: buildOptionalNoteLookup(nodes, (node) => node.routePath),
  },
})
