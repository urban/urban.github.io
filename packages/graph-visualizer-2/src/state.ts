import { Schema } from "effect"
import {
  GraphSnapshotSchema,
  type GraphSnapshot,
  type GraphSnapshotNode,
} from "@urban/build-graph/schema"
import {
  GRAPH_CONFIG,
  GRAPH_RENDER_DEPTH,
  type GraphAction,
  type GraphData,
  type GraphLink,
  type GraphNode,
  type GraphReducerContext,
  type GraphRenderModel,
  type GraphState,
  type NodeId,
  type NodeState,
  type RenderDepth,
  type RenderEdgeModel,
  type RenderLabelModel,
  type RenderNodeModel,
  type SelectionSnapshot,
  hasPosition,
  selectedNodeIdFromSelection,
} from "./shared"

const decodeGraphSnapshotUnknown = Schema.decodeUnknownSync(GraphSnapshotSchema)

export function decodeGraphSnapshot(payload: unknown): GraphSnapshot {
  return decodeGraphSnapshotUnknown(payload)
}

function toNodeLabel(relativePath: string) {
  return relativePath.endsWith(".md") ? relativePath.slice(0, -3) : relativePath
}

export function toSnapshotNodeLabel(node: GraphSnapshotNode) {
  return node.kind === "note" ? toNodeLabel(node.relativePath) : node.unresolvedTarget
}

function mapById<T extends { id: NodeId }>(items: readonly T[]) {
  return new Map(items.map((item) => [item.id, item]))
}

function buildAdjacency(
  nodes: readonly GraphNode[],
  links: readonly GraphLink[],
): Map<NodeId, Set<NodeId>> {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<NodeId>()]))
  for (const { sourceNodeId, targetNodeId } of links) {
    adjacency.get(sourceNodeId)?.add(targetNodeId)
    adjacency.get(targetNodeId)?.add(sourceNodeId)
  }
  return adjacency
}

export function createGraphDataFromSnapshot(snapshot: GraphSnapshot): GraphData {
  const nodes: GraphNode[] = snapshot.nodes.map((node) => ({
    id: node.id,
    label: toSnapshotNodeLabel(node),
  }))
  const nodeById = mapById(nodes)
  const snapshotNodeById = mapById(snapshot.nodes)
  const links = snapshot.edges.flatMap(({ sourceNodeId, targetNodeId }) =>
    nodeById.has(sourceNodeId) && nodeById.has(targetNodeId)
      ? [{ sourceNodeId, targetNodeId }]
      : [],
  )
  return {
    nodes,
    links,
    nodeById,
    snapshotNodeById,
    adjacency: buildAdjacency(nodes, links),
  }
}

export function createGraphDataFromSnapshotPayload(payload: unknown): GraphData {
  return createGraphDataFromSnapshot(decodeGraphSnapshot(payload))
}

export async function loadGraphDataFromSnapshot(snapshotUrl: URL): Promise<GraphData> {
  const response = await fetch(snapshotUrl)
  if (!response.ok) {
    throw new Error(`Failed to load graph snapshot: ${response.status} ${response.statusText}`)
  }
  const payload: unknown = await response.json()
  return createGraphDataFromSnapshotPayload(payload)
}

function collectNodeIdsWithinDepth(
  selectedNodeId: NodeId,
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>,
  depth: RenderDepth,
): ReadonlySet<NodeId> {
  const visibleNodeIds = new Set<NodeId>([selectedNodeId])
  let frontier: NodeId[] = [selectedNodeId]
  for (let currentDepth = 0; currentDepth < depth; currentDepth += 1) {
    const nextFrontier: NodeId[] = []
    for (const nodeId of frontier) {
      for (const neighborId of adjacency.get(nodeId) ?? []) {
        if (visibleNodeIds.has(neighborId)) continue
        visibleNodeIds.add(neighborId)
        nextFrontier.push(neighborId)
      }
    }
    frontier = nextFrontier
    if (frontier.length === 0) break
  }
  return visibleNodeIds
}

function toSelection(
  selectedNodeId: NodeId | null,
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>,
  depth: RenderDepth,
): SelectionSnapshot {
  if (selectedNodeId === null) return { type: "none" }
  const unmutedNodeIds = collectNodeIdsWithinDepth(selectedNodeId, adjacency, depth)
  return { type: "selected", nodeId: selectedNodeId, unmutedNodeIds }
}

function getNodeState(nodeId: NodeId, selection: SelectionSnapshot): NodeState {
  if (selection.type === "none") return "default"
  if (selection.nodeId === nodeId) return "selected"
  return selection.unmutedNodeIds.has(nodeId) ? "default" : "muted"
}

export function deriveRenderModel({
  nodes,
  links,
  nodeById,
  adjacency,
  selection,
  hoveredNodeId,
  draggedNodeId,
}: {
  nodes: readonly GraphNode[]
  links: readonly GraphLink[]
  nodeById: ReadonlyMap<NodeId, GraphNode>
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
  selection: SelectionSnapshot
  hoveredNodeId: NodeId | null
  draggedNodeId: NodeId | null
}): GraphRenderModel {
  const visibleNodeIds = selection.type === "selected" ? selection.unmutedNodeIds : null
  const nodeStateById = new Map(nodes.map((node) => [node.id, getNodeState(node.id, selection)]))
  const focusNodeId = draggedNodeId ?? hoveredNodeId
  const focusNodeNeighbors = focusNodeId === null ? null : adjacency.get(focusNodeId)
  const renderNodes: RenderNodeModel[] = []
  for (const node of nodes) {
    if (visibleNodeIds !== null && !visibleNodeIds.has(node.id)) continue
    renderNodes.push({
      id: node.id,
      visual: nodeStateById.get(node.id) ?? "default",
      position: hasPosition(node) ? { x: node.x, y: node.y } : null,
    })
  }

  const renderEdges: RenderEdgeModel[] = []
  for (const link of links) {
    if (
      visibleNodeIds !== null &&
      (!visibleNodeIds.has(link.sourceNodeId) || !visibleNodeIds.has(link.targetNodeId))
    ) {
      continue
    }
    const source = nodeById.get(link.sourceNodeId)
    const target = nodeById.get(link.targetNodeId)
    if (!source || !target || !hasPosition(source) || !hasPosition(target)) continue
    renderEdges.push({
      source: { x: source.x, y: source.y },
      target: { x: target.x, y: target.y },
      visual:
        focusNodeId !== null &&
        (link.sourceNodeId === focusNodeId || link.targetNodeId === focusNodeId)
          ? "default"
          : "muted",
    })
  }

  const labels: RenderLabelModel[] = []
  for (const node of nodes) {
    if (visibleNodeIds !== null && !visibleNodeIds.has(node.id)) continue
    if (!hasPosition(node)) continue
    const nodeVisual = nodeStateById.get(node.id) ?? "default"
    const nodeRadius = GRAPH_CONFIG.node.radius * GRAPH_CONFIG.node.variants[nodeVisual].scale
    const isWithinHoverDepthOne =
      focusNodeId === null || focusNodeId === node.id || focusNodeNeighbors?.has(node.id) === true
    labels.push({
      id: node.id,
      text: node.label,
      x: node.x,
      y: node.y + nodeRadius + GRAPH_CONFIG.label.offset,
      state: isWithinHoverDepthOne ? nodeVisual : "muted",
      isHovered: draggedNodeId === null && hoveredNodeId === node.id,
    })
  }

  return {
    nodes: renderNodes,
    edges: renderEdges,
    labels,
  }
}

function toSelectedNodeId(
  selectedNodeId: NodeId | null,
  context: GraphReducerContext,
): NodeId | null {
  if (context.nodes.length === 0) return null
  if (selectedNodeId !== null && context.nodeById.has(selectedNodeId)) return selectedNodeId
  return context.nodes[0]?.id ?? null
}

export function createGraphState(
  selectedNodeId: NodeId | null,
  hoveredNodeId: NodeId | null,
  draggedNodeId: NodeId | null,
  context: GraphReducerContext,
): GraphState {
  const selection = toSelection(
    toSelectedNodeId(selectedNodeId, context),
    context.adjacency,
    GRAPH_RENDER_DEPTH,
  )
  return {
    selection,
    hoveredNodeId,
    draggedNodeId,
    renderModel: deriveRenderModel({
      nodes: context.nodes,
      links: context.links,
      nodeById: context.nodeById,
      adjacency: context.adjacency,
      selection,
      hoveredNodeId,
      draggedNodeId,
    }),
  }
}

export type GraphStateCommand = { type: "selection/changed"; selectedNodeId: NodeId | null }

export function reduceGraphStateWithCommands(
  state: GraphState,
  action: GraphAction,
  context: GraphReducerContext,
): { state: GraphState; commands: ReadonlyArray<GraphStateCommand> } {
  const reduced = reduceGraphStateWithTransition(state, action, context)
  return {
    state: reduced.state,
    commands: reduced.transition.type === "none" ? [] : [reduced.transition],
  }
}

export type GraphStateTransition =
  | { type: "none" }
  | { type: GraphStateCommand["type"]; selectedNodeId: NodeId | null }

export function reduceGraphStateWithTransition(
  state: GraphState,
  action: GraphAction,
  context: GraphReducerContext,
): { state: GraphState; transition: GraphStateTransition } {
  const currentSelectionNodeId = selectedNodeIdFromSelection(state.selection)
  let nextState: GraphState

  switch (action.type) {
    case "simulation/tick":
      nextState = createGraphState(
        currentSelectionNodeId,
        state.hoveredNodeId,
        state.draggedNodeId,
        context,
      )
      break
    case "selection/set":
      nextState = createGraphState(action.nodeId, state.hoveredNodeId, state.draggedNodeId, context)
      break
    case "hover/set":
      if (state.hoveredNodeId === action.nodeId) {
        return { state, transition: { type: "none" } }
      }
      nextState = createGraphState(
        currentSelectionNodeId,
        action.nodeId,
        state.draggedNodeId,
        context,
      )
      break
    case "hover/clear":
      if (state.hoveredNodeId !== action.nodeId) {
        return { state, transition: { type: "none" } }
      }
      nextState = createGraphState(currentSelectionNodeId, null, state.draggedNodeId, context)
      break
    case "drag/focus/set":
      if (state.draggedNodeId === action.nodeId) {
        return { state, transition: { type: "none" } }
      }
      nextState = createGraphState(
        currentSelectionNodeId,
        state.hoveredNodeId,
        action.nodeId,
        context,
      )
      break
    case "drag/focus/clear":
      if (state.draggedNodeId !== action.nodeId) {
        return { state, transition: { type: "none" } }
      }
      nextState = createGraphState(currentSelectionNodeId, state.hoveredNodeId, null, context)
      break
  }

  const nextSelectionNodeId = selectedNodeIdFromSelection(nextState.selection)
  const transition: GraphStateTransition =
    currentSelectionNodeId === nextSelectionNodeId
      ? { type: "none" }
      : { type: "selection/changed", selectedNodeId: nextSelectionNodeId }

  return { state: nextState, transition }
}

export function reduceGraphState(
  state: GraphState,
  action: GraphAction,
  context: GraphReducerContext,
): GraphState {
  return reduceGraphStateWithTransition(state, action, context).state
}
