import { Effect, Schema } from "effect"
import type {
  GraphSnapshot,
  GraphSnapshotEdge,
  GraphSnapshotNode,
  GraphSnapshotPlaceholderNode,
} from "../domain/schema"

const DuplicateNodeIdIssueSchema = Schema.TaggedStruct("DuplicateNodeId", {
  nodeId: Schema.String,
})

const MissingEdgeEndpointIssueSchema = Schema.TaggedStruct("MissingEdgeEndpoint", {
  sourceNodeId: Schema.String,
  targetNodeId: Schema.String,
  endpoint: Schema.Union([Schema.Literal("source"), Schema.Literal("target")]),
  missingNodeId: Schema.String,
})

const InvalidNoteLabelIssueSchema = Schema.TaggedStruct("InvalidNoteLabel", {
  nodeId: Schema.String,
  relativePath: Schema.String,
})

export const GraphVisualizerModelIssueSchema = Schema.Union([
  DuplicateNodeIdIssueSchema,
  MissingEdgeEndpointIssueSchema,
  InvalidNoteLabelIssueSchema,
])

export type GraphVisualizerModelIssue = Schema.Schema.Type<typeof GraphVisualizerModelIssueSchema>

export type GraphRenderNoteNode = {
  readonly id: string
  readonly kind: "note"
  readonly label: string
  readonly relativePath: string
}

export type GraphRenderPlaceholderNode = {
  readonly id: string
  readonly kind: "placeholder"
  readonly label: string
  readonly unresolvedTarget: string
}

export type GraphRenderNode = GraphRenderNoteNode | GraphRenderPlaceholderNode

export type GraphRenderEdge = {
  readonly sourceNodeId: string
  readonly targetNodeId: string
}

export type GraphRenderModel = {
  readonly nodes: ReadonlyArray<GraphRenderNode>
  readonly edges: ReadonlyArray<GraphRenderEdge>
  readonly adjacencyByNodeId: Readonly<Record<string, ReadonlyArray<string>>>
}

export class GraphVisualizerModelIntegrityError extends Schema.TaggedErrorClass<GraphVisualizerModelIntegrityError>()(
  "GraphVisualizerModelIntegrityError",
  {
    message: Schema.String,
    issue: GraphVisualizerModelIssueSchema,
  },
) {}

const failModelIntegrity = (issue: GraphVisualizerModelIssue) =>
  Effect.fail(
    new GraphVisualizerModelIntegrityError({
      message:
        issue._tag === "DuplicateNodeId"
          ? `Duplicate node id in snapshot: ${issue.nodeId}`
          : issue._tag === "InvalidNoteLabel"
            ? `Invalid note label derived from relativePath: ${issue.relativePath}`
            : `Edge references missing ${issue.endpoint} node id: ${issue.missingNodeId}`,
      issue,
    }),
  )

const deriveNoteLabel = (
  node: Extract<GraphSnapshotNode, { kind: "note" }>,
): Effect.Effect<string, GraphVisualizerModelIntegrityError> => {
  const pathSegments = node.relativePath.split("/").filter((segment) => segment.length > 0)
  const filename =
    pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : node.relativePath
  const extensionIndex = filename.lastIndexOf(".")
  const stem = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename
  const label = stem.trim()

  if (label.length === 0) {
    return failModelIntegrity({
      _tag: "InvalidNoteLabel",
      nodeId: node.id,
      relativePath: node.relativePath,
    })
  }

  return Effect.succeed(label)
}

const derivePlaceholderLabel = (node: GraphSnapshotPlaceholderNode): string => {
  const unresolvedTarget = node.unresolvedTarget.trim()
  if (unresolvedTarget.length > 0) {
    return unresolvedTarget
  }

  const withoutPrefix = node.id.startsWith("placeholder:")
    ? node.id.slice("placeholder:".length)
    : node.id
  const fallback = withoutPrefix.trim()
  return fallback.length > 0 ? fallback : "unresolved"
}

const toRenderNode = (
  node: GraphSnapshotNode,
): Effect.Effect<GraphRenderNode, GraphVisualizerModelIntegrityError> =>
  Effect.gen(function* () {
    if (node.kind === "note") {
      const label = yield* deriveNoteLabel(node)
      return {
        id: node.id,
        kind: "note",
        label,
        relativePath: node.relativePath,
      }
    }

    return {
      id: node.id,
      kind: "placeholder",
      label: derivePlaceholderLabel(node),
      unresolvedTarget: node.unresolvedTarget,
    }
  })

const ensureEdgeEndpointExists = (
  edge: GraphSnapshotEdge,
  endpoint: "source" | "target",
  nodesById: ReadonlyMap<string, GraphRenderNode>,
): Effect.Effect<void, GraphVisualizerModelIntegrityError> => {
  const nodeId = endpoint === "source" ? edge.sourceNodeId : edge.targetNodeId
  if (nodesById.has(nodeId)) {
    return Effect.void
  }

  return failModelIntegrity({
    _tag: "MissingEdgeEndpoint",
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    endpoint,
    missingNodeId: nodeId,
  })
}

const addAdjacent = (
  adjacencyByNodeId: Map<string, Set<string>>,
  sourceNodeId: string,
  targetNodeId: string,
) => {
  const sourceNeighbors = adjacencyByNodeId.get(sourceNodeId)
  if (sourceNeighbors !== undefined) {
    sourceNeighbors.add(targetNodeId)
  }
}

const toAdjacencyRecord = (
  adjacencyByNodeId: ReadonlyMap<string, ReadonlySet<string>>,
): Readonly<Record<string, ReadonlyArray<string>>> => {
  const record: Record<string, ReadonlyArray<string>> = {}
  const sortedNodeIds = [...adjacencyByNodeId.keys()].sort((left, right) =>
    left.localeCompare(right),
  )
  for (const nodeId of sortedNodeIds) {
    const neighbors = adjacencyByNodeId.get(nodeId)
    if (neighbors === undefined) {
      continue
    }
    record[nodeId] = [...neighbors].sort((left, right) => left.localeCompare(right))
  }
  return record
}

export const buildGraphRenderModel = (
  snapshot: GraphSnapshot,
): Effect.Effect<GraphRenderModel, GraphVisualizerModelIntegrityError> =>
  Effect.gen(function* () {
    const nodesById = new Map<string, GraphRenderNode>()

    for (const node of snapshot.nodes) {
      if (nodesById.has(node.id)) {
        return yield* failModelIntegrity({
          _tag: "DuplicateNodeId",
          nodeId: node.id,
        })
      }

      const renderNode = yield* toRenderNode(node)
      nodesById.set(renderNode.id, renderNode)
    }

    const edges: Array<GraphRenderEdge> = []
    const adjacencyByNodeId = new Map<string, Set<string>>()
    for (const nodeId of nodesById.keys()) {
      adjacencyByNodeId.set(nodeId, new Set<string>())
    }

    for (const edge of snapshot.edges) {
      yield* ensureEdgeEndpointExists(edge, "source", nodesById)
      yield* ensureEdgeEndpointExists(edge, "target", nodesById)

      edges.push({
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
      })

      addAdjacent(adjacencyByNodeId, edge.sourceNodeId, edge.targetNodeId)
      addAdjacent(adjacencyByNodeId, edge.targetNodeId, edge.sourceNodeId)
    }

    const sortedNodes = [...nodesById.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    )
    const sortedEdges = [...edges].sort((left, right) => {
      const sourceOrder = left.sourceNodeId.localeCompare(right.sourceNodeId)
      if (sourceOrder !== 0) {
        return sourceOrder
      }
      return left.targetNodeId.localeCompare(right.targetNodeId)
    })

    return {
      nodes: sortedNodes,
      edges: sortedEdges,
      adjacencyByNodeId: toAdjacencyRecord(adjacencyByNodeId),
    }
  })
