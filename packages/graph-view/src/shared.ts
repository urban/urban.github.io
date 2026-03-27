import * as d3 from "d3-force"
import * as PIXI from "pixi.js"
import type { GraphSnapshotNode } from "@urban/build-graph/schema"

export type NodeId = string
export type NodeState = "default" | "selected" | "muted"
export type EdgeState = "default" | "muted"
export type Point = { x: number; y: number }
export type Size = { width: number; height: number }
export type RenderDepth = 1 | 2 | 3 | typeof Infinity
export type Disposer = () => void

export type GraphTheme = {
  view: { backgroundColor: number }
  node: {
    variants: Record<
      NodeState,
      { fill: number; stroke: number; strokeWidth: number; alpha: number }
    >
    scales: Record<NodeState, number>
  }
  edge: {
    variants: Record<EdgeState, { width: number; color: number; alpha: number }>
  }
  label: {
    variants: Record<NodeState, { fill: number; alpha: number }>
    style: PIXI.TextStyleOptions
  }
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: NodeId
  label: string
}

export interface GraphLink {
  sourceNodeId: NodeId
  targetNodeId: NodeId
}

export interface SimulationGraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: NodeId | GraphNode
  target: NodeId | GraphNode
  sourceNodeId: NodeId
  targetNodeId: NodeId
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  nodeById: Map<NodeId, GraphNode>
  snapshotNodeById: Map<NodeId, GraphSnapshotNode>
  adjacency: Map<NodeId, Set<NodeId>>
}

export interface GraphSimulationController {
  simulation: d3.Simulation<GraphNode, SimulationGraphLink>
  setSelectedNodeId: (selectedNodeId: NodeId | null) => void
  setLayoutCenter: (center: Point) => void
  syncSelectedLayoutCenter: () => void
  dispose: () => void
}

export interface GraphReducerContext {
  nodes: readonly GraphNode[]
  links: readonly GraphLink[]
  nodeById: ReadonlyMap<NodeId, GraphNode>
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
}

export type SelectionSnapshot =
  | { type: "none" }
  | { type: "selected"; nodeId: NodeId; unmutedNodeIds: ReadonlySet<NodeId> }

export type RenderLabelModel = {
  id: NodeId
  text: string
  x: number
  y: number
  state: NodeState
  scaleState: NodeState
  isHovered: boolean
}

export type RenderNodeModel = {
  id: NodeId
  visual: NodeState
  scaleState: NodeState
  position: Point | null
}
export type RenderEdgeModel = { source: Point; target: Point; visual: EdgeState }

export type GraphRenderModel = {
  nodes: readonly RenderNodeModel[]
  edges: readonly RenderEdgeModel[]
  labels: readonly RenderLabelModel[]
}

export interface GraphState {
  selection: SelectionSnapshot
  hoveredNodeId: NodeId | null
  draggedNodeId: NodeId | null
  renderModel: GraphRenderModel
}

export type GraphAction =
  | { type: "simulation/tick" }
  | { type: "selection/set"; nodeId: NodeId }
  | { type: "hover/set"; nodeId: NodeId }
  | { type: "hover/clear"; nodeId: NodeId }
  | { type: "drag/focus/set"; nodeId: NodeId }
  | { type: "drag/focus/clear"; nodeId: NodeId }

export type PointerGestureState =
  | { type: "idle" }
  | { type: "panning"; startGlobal: Point; startWorld: Point }
  | { type: "dragging-node"; nodeId: NodeId; startGlobal: Point; hasMoved: boolean }

export interface AppState {
  graph: GraphState
  pointer: PointerGestureState
  pointerGlobal: Point | null
}

export type AppAction =
  | { type: "graph/action"; action: GraphAction }
  | { type: "pointer/stage-down"; global: Point; world: Point }
  | { type: "pointer/node-down"; nodeId: NodeId; global: Point }
  | { type: "pointer/node-over"; nodeId: NodeId }
  | { type: "pointer/node-out"; nodeId: NodeId }
  | { type: "pointer/move"; global: Point }
  | { type: "pointer/release" }

export type AppCommand =
  | { type: "simulation/sync-selected-layout-center" }
  | { type: "simulation/set-selected-node"; nodeId: NodeId | null }
  | { type: "simulation/reheat"; alpha: number }
  | { type: "selection/notify-host"; selectedNodeId: NodeId | null }
  | { type: "simulation/alpha-target"; alphaTarget: number; restart: boolean }
  | { type: "world/set-position"; position: Point }
  | { type: "drag/set-node-fixed-position"; nodeId: NodeId; pointerGlobal: Point }
  | { type: "drag/release-node-fixed-position"; nodeId: NodeId }
  | {
      type: "drag/center-released-selected-node"
      releasedNodeId: NodeId
      selectedNodeId: NodeId | null
    }

export interface NodeSpriteController {
  sprite: PIXI.Graphics
  state: NodeState
  scaleState: NodeState
  targetScale: number
  setState: (nodeState: NodeState, scaleState: NodeState, theme: GraphTheme) => void
  setPosition: (x: number, y: number) => void
  onPointerDown: (onDown: (event: PIXI.FederatedPointerEvent) => void) => Disposer
  onPointerOver: (onOver: () => void) => Disposer
  onPointerOut: (onOut: () => void) => Disposer
}

export type LocalCoordinateSpace = { toLocal: (point: Point) => Point }

const GRAPH_LABEL_STYLE: PIXI.TextStyleOptions = {
  fontFamily: "Arial",
  fontSize: 16,
  fontWeight: "400",
}

const LIGHT_GRAPH_THEME: GraphTheme = {
  view: { backgroundColor: 0xf5f5f5 },
  node: {
    variants: {
      default: { fill: 0x78716c, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 1 },
      selected: { fill: 0x0c0a09, stroke: 0xf5f5f4, strokeWidth: 2, alpha: 1 },
      muted: { fill: 0xd6d3d1, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 0.45 },
    },
    scales: {
      default: 1,
      selected: 2,
      muted: 1,
    },
  },
  edge: {
    variants: {
      default: { width: 2, color: 0x57534e, alpha: 0.55 },
      muted: { width: 2, color: 0xa8a29e, alpha: 0.18 },
    },
  },
  label: {
    variants: {
      default: { fill: 0x0c0a09, alpha: 1 },
      selected: { fill: 0x0c0a09, alpha: 1 },
      muted: { fill: 0x78716c, alpha: 0.45 },
    },
    style: {
      ...GRAPH_LABEL_STYLE,
    },
  },
}

const DARK_GRAPH_THEME: GraphTheme = {
  view: { backgroundColor: 0x1b1917 },
  node: {
    variants: {
      default: { fill: 0xa8a29e, stroke: 0x0c0a09, strokeWidth: 1, alpha: 1 },
      selected: { fill: 0xf5f5f4, stroke: 0x0c0a09, strokeWidth: 2, alpha: 1 },
      muted: { fill: 0x44403c, stroke: 0x0c0a09, strokeWidth: 1, alpha: 0.45 },
    },
    scales: {
      default: 1,
      selected: 2,
      muted: 1,
    },
  },
  edge: {
    variants: {
      default: { width: 2, color: 0xd6d3d1, alpha: 0.5 },
      muted: { width: 2, color: 0x57534e, alpha: 0.25 },
    },
  },
  label: {
    variants: {
      default: { fill: 0xf5f5f4, alpha: 1 },
      selected: { fill: 0xf5f5f4, alpha: 1 },
      muted: { fill: 0xa8a29e, alpha: 0.45 },
    },
    style: {
      ...GRAPH_LABEL_STYLE,
    },
  },
}

export function resolveGraphTheme(documentObject: Document): GraphTheme {
  return documentObject.documentElement.classList.contains("dark")
    ? DARK_GRAPH_THEME
    : LIGHT_GRAPH_THEME
}

const MAX_NODE_SCALE = Math.max(
  ...Object.values(LIGHT_GRAPH_THEME.node.scales),
  ...Object.values(DARK_GRAPH_THEME.node.scales),
)

export const GRAPH_CONFIG = {
  node: {
    radius: 6,
    scaleAnimationSpeed: 10,
    maxScale: MAX_NODE_SCALE,
    maxStrokeWidth: 2,
  },
  label: {
    offset: 6,
    hoverOffset: 10,
    hoverAnimationSpeed: 8,
    lineHeight: 1.2,
    approximateCharWidth: 8,
    horizontalPadding: 4,
    overlapGap: 3,
    maxAvoidanceSteps: 8,
    avoidanceStep: 16,
    nodeClearance: 2,
    fadeStartZoom: 1,
    fadeExponent: 2,
  },
  zoom: { min: 0.2, max: 3 },
  physics: {
    linkDistance: 200,
    linkStrength: 0.2,
    chargeStrength: -90,
    collisionRadius: 50,
    selectedNeighborCollisionRadius: 80,
    dragAlphaTarget: 0.3,
    idleAlphaTarget: 0,
    selectedCenterClearanceRadius: 250,
    selectedCenterAttractionStrength: 0.006,
    selectedCenterAttractionMaxVelocity: 0.6,
    selectedNeighborRingRadius: 220,
    selectedNeighborRingStrength: 0.7,
    selectedCenterReheatAlpha: 0.28,
  },
  interaction: {
    selectionMaxMovement: 5,
  },
}

export const POINTER_DOWN_EVENT = "pointerdown" as const
export const POINTER_MOVE_EVENT = "pointermove" as const
export const POINTER_OVER_EVENT = "pointerover" as const
export const POINTER_OUT_EVENT = "pointerout" as const
export const POINTER_UP_EVENT = "pointerup" as const
export const POINTER_UP_OUTSIDE_EVENT = "pointerupoutside" as const
export const WHEEL_EVENT = "wheel" as const
export const POINTER_RELEASE_EVENTS: ReadonlyArray<
  typeof POINTER_UP_EVENT | typeof POINTER_UP_OUTSIDE_EVENT
> = [POINTER_UP_EVENT, POINTER_UP_OUTSIDE_EVENT]

export const GRAPH_RENDER_DEPTH: RenderDepth = 3

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function hasPosition(node: GraphNode): node is GraphNode & Point {
  return typeof node.x === "number" && typeof node.y === "number"
}

export function toGlobalPoint(event: PIXI.FederatedPointerEvent): Point {
  return { x: event.global.x, y: event.global.y }
}

export function movedBeyondSelectionDistance(start: Point, end: Point) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  return dx * dx + dy * dy > GRAPH_CONFIG.interaction.selectionMaxMovement ** 2
}

export function onPointerRelease(container: PIXI.Container, onRelease: () => void) {
  for (const eventName of POINTER_RELEASE_EVENTS) container.on(eventName, onRelease)
  return () => {
    for (const eventName of POINTER_RELEASE_EVENTS) container.off(eventName, onRelease)
  }
}

export function selectedNodeIdFromSelection(selection: SelectionSnapshot): NodeId | null {
  return selection.type === "selected" ? selection.nodeId : null
}
