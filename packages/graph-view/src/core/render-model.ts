import type {
  GraphSnapshot,
  GraphSnapshotEdge,
  GraphSnapshotNode,
} from "@urban/build-graph/src/domain/schema"

const compareStrings = (left: string, right: string): number => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

type RenderModelNoteNode = {
  readonly kind: "note"
  readonly nodeId: string
  readonly label: string
}

type RenderModelPlaceholderNode = {
  readonly kind: "placeholder"
  readonly nodeId: string
  readonly label: string
}

type RenderModelNode = RenderModelNoteNode | RenderModelPlaceholderNode

type RenderModelEdge = {
  readonly sourceNodeIndex: number
  readonly targetNodeIndex: number
}

export type RenderModel = {
  readonly nodes: ReadonlyArray<RenderModelNode>
  readonly edges: ReadonlyArray<RenderModelEdge>
}

type RenderModelInvariant =
  | {
      readonly _tag: "DuplicateNodeId"
      readonly nodeId: string
    }
  | {
      readonly _tag: "MissingEdgeSourceNode"
      readonly nodeId: string
      readonly edge: GraphSnapshotEdge
    }
  | {
      readonly _tag: "MissingEdgeTargetNode"
      readonly nodeId: string
      readonly edge: GraphSnapshotEdge
    }

const formatInvariantMessage = (invariant: RenderModelInvariant): string => {
  switch (invariant._tag) {
    case "DuplicateNodeId":
      return `Graph render invariant violation: duplicate node id '${invariant.nodeId}' in snapshot.nodes`
    case "MissingEdgeSourceNode":
      return `Graph render invariant violation: edge sourceNodeId '${invariant.nodeId}' does not exist in snapshot.nodes`
    case "MissingEdgeTargetNode":
      return `Graph render invariant violation: edge targetNodeId '${invariant.nodeId}' does not exist in snapshot.nodes`
  }
}

export class GraphViewRenderInvariantError extends Error {
  readonly invariant: RenderModelInvariant

  constructor(invariant: RenderModelInvariant) {
    super(formatInvariantMessage(invariant))
    this.name = "GraphViewRenderInvariantError"
    this.invariant = invariant
  }
}

const sortNoteNodes = (left: GraphSnapshotNode, right: GraphSnapshotNode): number => {
  if (left.kind !== "note" || right.kind !== "note") {
    return 0
  }

  const idComparison = compareStrings(left.id, right.id)
  if (idComparison !== 0) {
    return idComparison
  }

  const pathComparison = compareStrings(left.relativePath, right.relativePath)
  if (pathComparison !== 0) {
    return pathComparison
  }

  return compareStrings(left.permalink, right.permalink)
}

const sortPlaceholderNodes = (left: GraphSnapshotNode, right: GraphSnapshotNode): number => {
  if (left.kind !== "placeholder" || right.kind !== "placeholder") {
    return 0
  }

  const idComparison = compareStrings(left.id, right.id)
  if (idComparison !== 0) {
    return idComparison
  }

  return compareStrings(left.unresolvedTarget, right.unresolvedTarget)
}

const sortEdges = (left: GraphSnapshotEdge, right: GraphSnapshotEdge): number => {
  const sourceComparison = compareStrings(left.sourceNodeId, right.sourceNodeId)
  if (sourceComparison !== 0) {
    return sourceComparison
  }

  const targetComparison = compareStrings(left.targetNodeId, right.targetNodeId)
  if (targetComparison !== 0) {
    return targetComparison
  }

  const sourcePathComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
  if (sourcePathComparison !== 0) {
    return sourcePathComparison
  }

  const wikilinkComparison = compareStrings(left.rawWikilink, right.rawWikilink)
  if (wikilinkComparison !== 0) {
    return wikilinkComparison
  }

  const targetComparison2 = compareStrings(left.target, right.target)
  if (targetComparison2 !== 0) {
    return targetComparison2
  }

  const strategyComparison = compareStrings(left.resolutionStrategy, right.resolutionStrategy)
  if (strategyComparison !== 0) {
    return strategyComparison
  }

  return compareStrings(left.displayText ?? "", right.displayText ?? "")
}

export const buildRenderModel = (snapshot: GraphSnapshot): RenderModel => {
  const noteNodes = snapshot.nodes.filter((node) => node.kind === "note").sort(sortNoteNodes)
  const placeholderNodes = snapshot.nodes
    .filter((node) => node.kind === "placeholder")
    .sort(sortPlaceholderNodes)
  const sortedNodes: ReadonlyArray<GraphSnapshotNode> = [...noteNodes, ...placeholderNodes]

  const nodeIndices = new Map<string, number>()
  const nodes: Array<RenderModelNode> = []

  for (let index = 0; index < sortedNodes.length; index += 1) {
    const node = sortedNodes[index]
    if (nodeIndices.has(node.id)) {
      throw new GraphViewRenderInvariantError({
        _tag: "DuplicateNodeId",
        nodeId: node.id,
      })
    }
    nodeIndices.set(node.id, index)

    if (node.kind === "note") {
      nodes.push({
        kind: "note",
        nodeId: node.id,
        label: node.relativePath,
      })
      continue
    }

    nodes.push({
      kind: "placeholder",
      nodeId: node.id,
      label: `unresolved:${node.unresolvedTarget}`,
    })
  }

  const edges: Array<RenderModelEdge> = []
  const sortedEdges = [...snapshot.edges].sort(sortEdges)
  for (const edge of sortedEdges) {
    const sourceNodeIndex = nodeIndices.get(edge.sourceNodeId)
    if (sourceNodeIndex === undefined) {
      throw new GraphViewRenderInvariantError({
        _tag: "MissingEdgeSourceNode",
        nodeId: edge.sourceNodeId,
        edge,
      })
    }

    const targetNodeIndex = nodeIndices.get(edge.targetNodeId)
    if (targetNodeIndex === undefined) {
      throw new GraphViewRenderInvariantError({
        _tag: "MissingEdgeTargetNode",
        nodeId: edge.targetNodeId,
        edge,
      })
    }

    edges.push({
      sourceNodeIndex,
      targetNodeIndex,
    })
  }

  return {
    nodes,
    edges,
  }
}
