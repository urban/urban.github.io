import * as PIXI from "pixi.js"
import * as d3 from "d3-force"
import { Schema } from "effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { GraphSnapshotSchema, type GraphSnapshot } from "@urban/build-graph/src/domain/schema"

export type NodeId = string
export type NodeState = "default" | "selected" | "muted"
export type EdgeState = "default" | "muted"
export type Point = { x: number; y: number }
type RenderDepth = 1 | 2 | 3 | typeof Infinity

type RenderLabelModel = {
  id: NodeId
  text: string
  x: number
  y: number
  state: NodeState
  isHovered: boolean
}
type RegisterNodeInteraction = (node: GraphNode, sprite: NodeSpriteController) => void
type LocalCoordinateSpace = { toLocal: (point: Point) => Point }
type DragInteractionState =
  | { type: "idle" }
  | { type: "dragging"; nodeId: NodeId; startGlobal: Point; hasMoved: boolean }
type SpriteInteractionAction =
  | { type: "drag/start"; nodeId: NodeId; global: Point }
  | { type: "drag/move"; global: Point }
  | { type: "drag/end" }
export type SelectionSnapshot =
  | { type: "none" }
  | { type: "selected"; nodeId: NodeId; unmutedNodeIds: ReadonlySet<NodeId> }

const GRAPH_LABEL_STYLE: PIXI.TextStyleOptions = {
  fill: 0xe2e8f0,
  fontFamily: "Arial",
  fontSize: 14,
  fontWeight: "400",
}

const GRAPH_CONFIG = {
  view: { backgroundAlpha: 1, backgroundColor: 0x0b0f14 },
  node: {
    radius: 6,
    variants: {
      default: { fill: 0x94a3b8, stroke: 0x0f172a, strokeWidth: 1, scale: 1, alpha: 1 },
      selected: { fill: 0x7dd3fc, stroke: 0x082f49, strokeWidth: 2, scale: 2, alpha: 1 },
      muted: { fill: 0x64748b, stroke: 0x0f172a, strokeWidth: 1, scale: 1, alpha: 0.2 },
    },
  },
  edge: {
    variants: {
      default: { width: 2, color: 0x93c5fd, alpha: 0.9 },
      muted: { width: 2, color: 0x93c5fd, alpha: 0.1 },
    },
  },
  label: {
    offset: 6,
    hoverOffset: 10,
    hoverAnimationSpeed: 8,
    variants: {
      default: { tint: 0xe2e8f0, alpha: 1 },
      selected: { tint: 0x7dd3fc, alpha: 1 },
      muted: { tint: 0x94a3b8, alpha: 0.3 },
    },
    lineHeight: 1.2,
    approximateCharWidth: 8,
    horizontalPadding: 4,
    overlapGap: 3,
    maxAvoidanceSteps: 8,
    avoidanceStep: 16,
    nodeClearance: 2,
    fadeStartZoom: 1,
    fadeExponent: 2,
    style: GRAPH_LABEL_STYLE,
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

const POINTER_RELEASE_EVENTS = ["pointerup", "pointerupoutside"]
const GRAPH_RENDER_DEPTH: RenderDepth = 3
const decodeGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

export interface GraphNode extends d3.SimulationNodeDatum {
  id: NodeId
  label: string
}

export interface GraphLink {
  sourceNodeId: NodeId
  targetNodeId: NodeId
}

interface SimulationGraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: NodeId | GraphNode
  target: NodeId | GraphNode
  sourceNodeId: NodeId
  targetNodeId: NodeId
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  nodeById: Map<NodeId, GraphNode>
  adjacency: Map<NodeId, Set<NodeId>>
}

interface GraphSimulationController {
  simulation: d3.Simulation<GraphNode, SimulationGraphLink>
  setSelectedNodeId: (selectedNodeId: NodeId | null) => void
  syncSelectedLayoutCenter: () => void
}

interface NodeSpriteController {
  sprite: PIXI.Graphics
  state: NodeState
  setState: (nodeState: NodeState) => void
  setPosition: (x: number, y: number) => void
  onPointerDown: (onDown: (event: PIXI.FederatedPointerEvent) => void) => void
  onPointerOver: (onOver: () => void) => void
  onPointerOut: (onOut: () => void) => void
}

type RenderNodeModel = { id: NodeId; visual: NodeState; position: Point | null }
type RenderEdgeModel = { source: Point; target: Point; visual: EdgeState }
type GraphRenderModel = {
  nodes: readonly RenderNodeModel[]
  edges: readonly RenderEdgeModel[]
  labels: readonly RenderLabelModel[]
}

export interface GraphReducerContext {
  nodes: readonly GraphNode[]
  links: readonly GraphLink[]
  nodeById: ReadonlyMap<NodeId, GraphNode>
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
}

export interface GraphState {
  selection: SelectionSnapshot
  hoveredNodeId: NodeId | null
  renderModel: GraphRenderModel
}

export type GraphAction =
  | { type: "simulation/tick" }
  | { type: "selection/clear" }
  | { type: "selection/toggle"; nodeId: NodeId }
  | { type: "selection/set"; nodeId: NodeId }
  | { type: "hover/set"; nodeId: NodeId }
  | { type: "hover/clear"; nodeId: NodeId }

export interface SpriteInteractionState {
  drag: DragInteractionState
  pointerGlobal: Point | null
  selectionRequestNodeId: NodeId | null
  selectionRequestId: number
}

function toNodeLabel(relativePath: string) {
  return relativePath.endsWith(".md") ? relativePath.slice(0, -3) : relativePath
}

function toSnapshotNodeLabel(node: GraphSnapshot["nodes"][number]) {
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

function createGraphDataFromSnapshot(snapshot: GraphSnapshot): GraphData {
  const nodes: GraphNode[] = snapshot.nodes.map((node) => ({
    id: node.id,
    label: toSnapshotNodeLabel(node),
  }))
  const nodeById = mapById(nodes)
  const links = snapshot.edges.flatMap(({ sourceNodeId, targetNodeId }) =>
    nodeById.has(sourceNodeId) && nodeById.has(targetNodeId)
      ? [{ sourceNodeId, targetNodeId }]
      : [],
  )
  return { nodes, links, nodeById, adjacency: buildAdjacency(nodes, links) }
}

async function loadGraphDataFromSnapshot(snapshotUrl: URL): Promise<GraphData> {
  const response = await fetch(snapshotUrl)
  if (!response.ok) {
    throw new Error(`Failed to load graph snapshot: ${response.status} ${response.statusText}`)
  }
  const payload: unknown = await response.json()
  return createGraphDataFromSnapshot(decodeGraphSnapshot(payload))
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function hasPosition(node: GraphNode): node is GraphNode & Point {
  return typeof node.x === "number" && typeof node.y === "number"
}

function toGlobalPoint(event: PIXI.FederatedPointerEvent): Point {
  return { x: event.global.x, y: event.global.y }
}

function movedBeyondSelectionDistance(start: Point, end: Point) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  return dx * dx + dy * dy > GRAPH_CONFIG.interaction.selectionMaxMovement ** 2
}

function onPointerRelease(container: PIXI.Container, onRelease: () => void) {
  for (const eventName of POINTER_RELEASE_EVENTS) container.on(eventName, onRelease)
}

function applyNodeVariant(sprite: PIXI.Graphics, nodeState: NodeState) {
  const variant = GRAPH_CONFIG.node.variants[nodeState]
  sprite.clear()
  sprite.circle(0, 0, GRAPH_CONFIG.node.radius).fill(variant.fill)
  sprite
    .circle(0, 0, GRAPH_CONFIG.node.radius)
    .stroke({ width: variant.strokeWidth, color: variant.stroke, alpha: 1 })
  sprite.scale.set(variant.scale)
  sprite.alpha = variant.alpha
}

function createNodeSprite(): NodeSpriteController {
  const sprite = new PIXI.Graphics()
  applyNodeVariant(sprite, "default")
  sprite.eventMode = "static"
  sprite.cursor = "pointer"

  const controller: NodeSpriteController = {
    sprite,
    state: "default",
    setState: (nodeState) => {
      if (controller.state === nodeState) return
      controller.state = nodeState
      applyNodeVariant(sprite, nodeState)
    },
    setPosition: (x, y) => sprite.position.set(x, y),
    onPointerDown: (onDown) => sprite.on("pointerdown", onDown),
    onPointerOver: (onOver) => sprite.on("pointerover", onOver),
    onPointerOut: (onOut) => sprite.on("pointerout", onOut),
  }

  return controller
}

function createNodeLabel(nodeLabel: string) {
  const label = new PIXI.Text({
    text: nodeLabel,
    style: {
      ...GRAPH_CONFIG.label.style,
    },
  })
  label.eventMode = "none"
  label.anchor.set(0.5, 0)
  label.roundPixels = true
  label.visible = false
  return label
}

async function createPixiApp(containerSelector: string) {
  const app = new PIXI.Application()
  await app.init({
    resizeTo: window,
    antialias: true,
    backgroundAlpha: GRAPH_CONFIG.view.backgroundAlpha,
    backgroundColor: GRAPH_CONFIG.view.backgroundColor,
  })

  const root = document.querySelector<HTMLElement>(containerSelector)
  if (!root) throw new Error(`Missing container element: ${containerSelector}`)
  if (!(app.canvas instanceof HTMLCanvasElement)) {
    throw new Error("Expected PIXI canvas to be HTMLCanvasElement")
  }

  root.appendChild(app.canvas)
  return app
}

function createWorld(app: PIXI.Application) {
  const world = new PIXI.Container()
  const edgeGraphics = new PIXI.Graphics()
  const nodeLayer = new PIXI.Container()
  const labelLayer = new PIXI.Container()
  world.sortableChildren = true
  edgeGraphics.zIndex = 0
  nodeLayer.zIndex = 1
  labelLayer.zIndex = 2
  world.addChild(edgeGraphics, nodeLayer, labelLayer)
  app.stage.addChild(world)
  return { world, edgeGraphics, nodeLayer, labelLayer }
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

function selectedNodeIdFromSelection(selection: SelectionSnapshot): NodeId | null {
  return selection.type === "selected" ? selection.nodeId : null
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
}: {
  nodes: readonly GraphNode[]
  links: readonly GraphLink[]
  nodeById: ReadonlyMap<NodeId, GraphNode>
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
  selection: SelectionSnapshot
  hoveredNodeId: NodeId | null
}): GraphRenderModel {
  const visibleNodeIds = selection.type === "selected" ? selection.unmutedNodeIds : null
  const nodeStateById = new Map(nodes.map((node) => [node.id, getNodeState(node.id, selection)]))
  const hoveredNodeNeighbors = hoveredNodeId === null ? null : adjacency.get(hoveredNodeId)
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
        hoveredNodeId !== null &&
        (link.sourceNodeId === hoveredNodeId || link.targetNodeId === hoveredNodeId)
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
      hoveredNodeId === null ||
      hoveredNodeId === node.id ||
      hoveredNodeNeighbors?.has(node.id) === true
    labels.push({
      id: node.id,
      text: node.label,
      x: node.x,
      y: node.y + nodeRadius + GRAPH_CONFIG.label.offset,
      state: isWithinHoverDepthOne ? nodeVisual : "muted",
      isHovered: hoveredNodeId === node.id,
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

function createGraphState(
  selectedNodeId: NodeId | null,
  hoveredNodeId: NodeId | null,
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
    renderModel: deriveRenderModel({
      nodes: context.nodes,
      links: context.links,
      nodeById: context.nodeById,
      adjacency: context.adjacency,
      selection,
      hoveredNodeId,
    }),
  }
}

export function reduceGraphState(
  state: GraphState,
  action: GraphAction,
  context: GraphReducerContext,
): GraphState {
  switch (action.type) {
    case "simulation/tick":
      return createGraphState(
        selectedNodeIdFromSelection(state.selection),
        state.hoveredNodeId,
        context,
      )
    case "selection/clear":
      return createGraphState(
        selectedNodeIdFromSelection(state.selection),
        state.hoveredNodeId,
        context,
      )
    case "selection/set":
      return createGraphState(action.nodeId, state.hoveredNodeId, context)
    case "selection/toggle": {
      return createGraphState(action.nodeId, state.hoveredNodeId, context)
    }
    case "hover/set":
      if (state.hoveredNodeId === action.nodeId) return state
      return createGraphState(selectedNodeIdFromSelection(state.selection), action.nodeId, context)
    case "hover/clear":
      if (state.hoveredNodeId !== action.nodeId) return state
      return createGraphState(selectedNodeIdFromSelection(state.selection), null, context)
  }
}

export function reduceSpriteInteractionState(
  state: SpriteInteractionState,
  action: SpriteInteractionAction,
): SpriteInteractionState {
  switch (action.type) {
    case "drag/start":
      return {
        ...state,
        drag: {
          type: "dragging",
          nodeId: action.nodeId,
          startGlobal: action.global,
          hasMoved: false,
        },
        pointerGlobal: action.global,
      }
    case "drag/move": {
      if (state.drag.type === "idle") return state
      const hasMoved =
        state.drag.hasMoved || movedBeyondSelectionDistance(state.drag.startGlobal, action.global)
      return {
        ...state,
        drag: hasMoved === state.drag.hasMoved ? state.drag : { ...state.drag, hasMoved },
        pointerGlobal: action.global,
      }
    }
    case "drag/end":
      if (state.drag.type === "idle") return state
      return {
        ...state,
        drag: { type: "idle" },
        pointerGlobal: null,
        selectionRequestNodeId: state.drag.hasMoved
          ? state.selectionRequestNodeId
          : state.drag.nodeId,
        selectionRequestId: state.drag.hasMoved
          ? state.selectionRequestId
          : state.selectionRequestId + 1,
      }
  }
}

type DragLifecycleTransition =
  | { type: "none" }
  | { type: "started"; nodeId: NodeId }
  | { type: "ended"; nodeId: NodeId }

type DraggingSpriteInteractionState = SpriteInteractionState & {
  drag: { type: "dragging"; nodeId: NodeId; startGlobal: Point; hasMoved: boolean }
}

function isDraggingInteractionState(
  state: SpriteInteractionState,
): state is DraggingSpriteInteractionState {
  return state.drag.type === "dragging"
}

function hasAdvancedSelectionRequest(
  previousState: SpriteInteractionState,
  state: SpriteInteractionState,
): state is SpriteInteractionState & { selectionRequestNodeId: NodeId } {
  return (
    previousState.selectionRequestId !== state.selectionRequestId &&
    state.selectionRequestNodeId !== null
  )
}

function toDragLifecycleTransition(
  previousState: SpriteInteractionState,
  state: SpriteInteractionState,
): DragLifecycleTransition {
  const wasDragging = isDraggingInteractionState(previousState)
  const isDragging = isDraggingInteractionState(state)
  if (!wasDragging && isDragging) {
    return { type: "started", nodeId: state.drag.nodeId }
  }
  if (wasDragging && !isDragging) {
    return { type: "ended", nodeId: previousState.drag.nodeId }
  }
  return { type: "none" }
}

function syncDraggedNodeToPointer({
  state,
  nodeById,
  world,
}: {
  state: SpriteInteractionState
  nodeById: ReadonlyMap<NodeId, GraphNode>
  world: LocalCoordinateSpace
}) {
  if (!isDraggingInteractionState(state) || state.pointerGlobal === null) return
  const dragNode = nodeById.get(state.drag.nodeId)
  if (!dragNode) return
  const position = world.toLocal(state.pointerGlobal)
  dragNode.fx = position.x
  dragNode.fy = position.y
}

function releaseDraggedNode(nodeId: NodeId, nodeById: ReadonlyMap<NodeId, GraphNode>) {
  const releasedNode = nodeById.get(nodeId)
  if (!releasedNode) return
  releasedNode.fx = null
  releasedNode.fy = null
}

export function centerSelectedReleasedNode({
  previousState,
  state,
  selectedNodeId,
  nodeById,
  world,
  getCanvasCenterGlobal,
}: {
  previousState: SpriteInteractionState
  state: SpriteInteractionState
  selectedNodeId: NodeId | null
  nodeById: ReadonlyMap<NodeId, GraphNode>
  world: LocalCoordinateSpace
  getCanvasCenterGlobal: () => Point
}): boolean {
  if (previousState.drag.type !== "dragging") return false
  if (state.drag.type !== "idle") return false
  if (selectedNodeId !== previousState.drag.nodeId) return false

  const selectedNode = nodeById.get(previousState.drag.nodeId)
  if (!selectedNode) return false
  if (!hasPosition(selectedNode)) return false
  const centerPoint = world.toLocal(getCanvasCenterGlobal())
  const { selectedCenterAttractionStrength, selectedCenterAttractionMaxVelocity } =
    GRAPH_CONFIG.physics

  const selectedDx = centerPoint.x - selectedNode.x
  const selectedDy = centerPoint.y - selectedNode.y
  const selectedDistance = Math.hypot(selectedDx, selectedDy)
  if (selectedDistance > 0) {
    const selectedVelocity = Math.min(
      selectedDistance * selectedCenterAttractionStrength,
      selectedCenterAttractionMaxVelocity,
    )
    selectedNode.vx = (selectedNode.vx ?? 0) + (selectedDx / selectedDistance) * selectedVelocity
    selectedNode.vy = (selectedNode.vy ?? 0) + (selectedDy / selectedDistance) * selectedVelocity
  }

  selectedNode.fx = null
  selectedNode.fy = null
  return true
}

function createGraphRenderer({
  nodes,
  nodeLayer,
  labelLayer,
  edgeGraphics,
  ticker,
  registerNodeInteraction,
}: {
  nodes: readonly GraphNode[]
  nodeLayer: PIXI.Container
  labelLayer: PIXI.Container
  edgeGraphics: PIXI.Graphics
  ticker: PIXI.Ticker
  registerNodeInteraction: RegisterNodeInteraction
}) {
  type LabelAnimationState = {
    baseX: number
    baseY: number
    currentOffset: number
    targetOffset: number
    baseAlpha: number
    currentVisibility: number
    targetVisibility: number
  }
  const nodeSprites = new Map<NodeId, NodeSpriteController>()
  const nodeLabels = new Map<NodeId, PIXI.Text>()
  const labelAnimationByNodeId = new Map<NodeId, LabelAnimationState>()
  const visibleNodeIds = new Set<NodeId>()
  const visibleLabelIds = new Set<NodeId>()
  for (const node of nodes) {
    const nodeSprite = createNodeSprite()
    const nodeLabel = createNodeLabel(node.label)
    nodeLayer.addChild(nodeSprite.sprite)
    labelLayer.addChild(nodeLabel)
    nodeSprites.set(node.id, nodeSprite)
    nodeLabels.set(node.id, nodeLabel)
    labelAnimationByNodeId.set(node.id, {
      baseX: 0,
      baseY: 0,
      currentOffset: 0,
      targetOffset: 0,
      baseAlpha: 0,
      currentVisibility: GRAPH_CONFIG.label.variants.default.alpha,
      targetVisibility: GRAPH_CONFIG.label.variants.default.alpha,
    })
    registerNodeInteraction(node, nodeSprite)
  }

  ticker.add(() => {
    const deltaSeconds = ticker.deltaMS / 1000
    const interpolation = 1 - Math.exp(-GRAPH_CONFIG.label.hoverAnimationSpeed * deltaSeconds)
    for (const [nodeId, animation] of labelAnimationByNodeId) {
      const labelSprite = nodeLabels.get(nodeId)
      if (!labelSprite || !labelSprite.visible) continue
      const offsetDelta = animation.targetOffset - animation.currentOffset
      if (Math.abs(offsetDelta) <= 0.01) {
        animation.currentOffset = animation.targetOffset
      } else {
        animation.currentOffset += offsetDelta * interpolation
      }
      const visibilityDelta = animation.targetVisibility - animation.currentVisibility
      if (Math.abs(visibilityDelta) <= 0.01) {
        animation.currentVisibility = animation.targetVisibility
      } else {
        animation.currentVisibility += visibilityDelta * interpolation
      }
      labelSprite.position.set(animation.baseX, animation.baseY + animation.currentOffset)
      labelSprite.alpha = animation.baseAlpha * animation.currentVisibility
    }
  })

  return {
    render: ({
      nodes: renderNodes,
      edges: renderEdges,
      labels: renderLabels,
    }: GraphRenderModel) => {
      const devicePixelRatio = window.devicePixelRatio || 1
      const parentScale = edgeGraphics.parent?.scale.x
      const worldScale = typeof parentScale === "number" && parentScale > 0 ? parentScale : 1
      const labelResolution = Math.max(1, devicePixelRatio * worldScale)
      const labelFadeZoomRange = GRAPH_CONFIG.label.fadeStartZoom - GRAPH_CONFIG.zoom.min
      const labelZoomAlphaLinear =
        labelFadeZoomRange > 0
          ? clamp((worldScale - GRAPH_CONFIG.zoom.min) / labelFadeZoomRange, 0, 1)
          : worldScale >= GRAPH_CONFIG.label.fadeStartZoom
            ? 1
            : 0
      const labelZoomAlpha = Math.pow(labelZoomAlphaLinear, GRAPH_CONFIG.label.fadeExponent)

      visibleNodeIds.clear()
      for (const node of renderNodes) {
        const nodeSprite = nodeSprites.get(node.id)
        if (!nodeSprite) continue
        visibleNodeIds.add(node.id)
        if (!nodeSprite.sprite.visible) nodeSprite.sprite.visible = true
        nodeSprite.setState(node.visual)
        if (node.position) nodeSprite.setPosition(node.position.x, node.position.y)
      }

      edgeGraphics.clear()
      for (const edge of renderEdges) {
        const variant = GRAPH_CONFIG.edge.variants[edge.visual]
        edgeGraphics.moveTo(edge.source.x, edge.source.y)
        edgeGraphics.lineTo(edge.target.x, edge.target.y)
        edgeGraphics.stroke({
          width: variant.width / worldScale,
          color: variant.color,
          alpha: variant.alpha,
        })
      }

      visibleLabelIds.clear()
      for (const label of renderLabels) {
        const labelSprite = nodeLabels.get(label.id)
        if (!labelSprite) continue
        visibleLabelIds.add(label.id)
        if (!labelSprite.visible) labelSprite.visible = true
        if (labelSprite.resolution !== labelResolution) labelSprite.resolution = labelResolution
        const animation = labelAnimationByNodeId.get(label.id)
        const variant = GRAPH_CONFIG.label.variants[label.state]
        const baseAlpha = labelZoomAlpha
        const targetVisibility = variant.alpha
        if (labelSprite.tint !== variant.tint) labelSprite.tint = variant.tint
        if (animation) {
          animation.baseX = label.x
          animation.baseY = label.y
          animation.targetOffset = label.isHovered ? GRAPH_CONFIG.label.hoverOffset : 0
          animation.baseAlpha = baseAlpha
          animation.targetVisibility = targetVisibility
          labelSprite.position.set(animation.baseX, animation.baseY + animation.currentOffset)
          labelSprite.alpha = animation.baseAlpha * animation.currentVisibility
        } else {
          labelSprite.position.set(label.x, label.y)
          labelSprite.alpha = baseAlpha * targetVisibility
        }
      }

      for (const [nodeId, labelSprite] of nodeLabels) {
        if (visibleLabelIds.has(nodeId)) continue
        if (labelSprite.visible) labelSprite.visible = false
      }

      for (const [nodeId, nodeSprite] of nodeSprites) {
        if (visibleNodeIds.has(nodeId)) continue
        if (nodeSprite.sprite.visible) nodeSprite.sprite.visible = false
      }
    },
  }
}

function toSimulationLink(link: GraphLink): SimulationGraphLink {
  return {
    sourceNodeId: link.sourceNodeId,
    targetNodeId: link.targetNodeId,
    source: link.sourceNodeId,
    target: link.targetNodeId,
  }
}

function createSimulation({
  nodes,
  links,
  nodeById,
  adjacency,
}: {
  nodes: GraphNode[]
  links: readonly GraphLink[]
  nodeById: ReadonlyMap<NodeId, GraphNode>
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
}): GraphSimulationController {
  const maxNodeVisualRadius = Math.max(
    GRAPH_CONFIG.physics.collisionRadius,
    GRAPH_CONFIG.node.radius * GRAPH_CONFIG.node.variants.default.scale +
      GRAPH_CONFIG.node.variants.default.strokeWidth / 2,
    GRAPH_CONFIG.node.radius * GRAPH_CONFIG.node.variants.selected.scale +
      GRAPH_CONFIG.node.variants.selected.strokeWidth / 2,
    GRAPH_CONFIG.node.radius * GRAPH_CONFIG.node.variants.muted.scale +
      GRAPH_CONFIG.node.variants.muted.strokeWidth / 2,
  )
  let selectedNodeId: NodeId | null = null
  const selectedNeighborCollisionForce = d3
    .forceCollide<GraphNode>((node) => {
      if (selectedNodeId === null || node.id === selectedNodeId) return maxNodeVisualRadius
      const selectedNodeNeighbors = adjacency.get(selectedNodeId)
      return selectedNodeNeighbors?.has(node.id) === true
        ? GRAPH_CONFIG.physics.selectedNeighborCollisionRadius
        : maxNodeVisualRadius
    })
    .strength(1)
    .iterations(2)
  const selectedNeighborRingForce = d3
    .forceRadial<GraphNode>(
      (node) => {
        if (selectedNodeId === null || node.id === selectedNodeId) return 0
        const selectedNodeNeighbors = adjacency.get(selectedNodeId)
        return selectedNodeNeighbors?.has(node.id) === true
          ? GRAPH_CONFIG.physics.selectedNeighborRingRadius
          : 0
      },
      window.innerWidth / 2,
      window.innerHeight / 2,
    )
    .strength((node) => {
      if (selectedNodeId === null || node.id === selectedNodeId) return 0
      const selectedNodeNeighbors = adjacency.get(selectedNodeId)
      return selectedNodeNeighbors?.has(node.id) === true
        ? GRAPH_CONFIG.physics.selectedNeighborRingStrength
        : 0
    })

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink<GraphNode, SimulationGraphLink>(links.map(toSimulationLink))
        .id((node) => node.id)
        .distance(GRAPH_CONFIG.physics.linkDistance)
        .strength(GRAPH_CONFIG.physics.linkStrength),
    )
    .force("charge", d3.forceManyBody().strength(GRAPH_CONFIG.physics.chargeStrength))
    .force("collide", selectedNeighborCollisionForce)
    .force("selected-neighbor-ring", selectedNeighborRingForce)
    .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))

  const syncSelectedLayoutCenter = () => {
    if (selectedNodeId === null) return
    const selectedNode = nodeById.get(selectedNodeId)
    if (!selectedNode || !hasPosition(selectedNode)) return
    selectedNeighborRingForce.x(selectedNode.x)
    selectedNeighborRingForce.y(selectedNode.y)
  }

  return {
    simulation,
    setSelectedNodeId: (nextSelectedNodeId) => {
      selectedNodeId =
        nextSelectedNodeId !== null && nodeById.has(nextSelectedNodeId) ? nextSelectedNodeId : null
      syncSelectedLayoutCenter()
    },
    syncSelectedLayoutCenter,
  }
}

function setupPanAndZoom({
  app,
  world,
  onBackgroundPointerDown,
  onZoom,
}: {
  app: PIXI.Application
  world: PIXI.Container
  onBackgroundPointerDown: () => void
  onZoom: () => void
}) {
  let isPanning = false
  let panStart: Point = { x: 0, y: 0 }
  let worldStart: Point = { x: 0, y: 0 }

  app.stage.eventMode = "static"
  app.stage.hitArea = app.screen

  app.stage.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
    onBackgroundPointerDown()
    isPanning = true
    panStart = toGlobalPoint(event)
    worldStart = { x: world.x, y: world.y }
  })

  app.stage.on("pointermove", (event: PIXI.FederatedPointerEvent) => {
    if (!isPanning) return
    world.position.set(
      worldStart.x + (event.global.x - panStart.x),
      worldStart.y + (event.global.y - panStart.y),
    )
  })

  onPointerRelease(app.stage, () => {
    isPanning = false
  })

  app.canvas.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      event.preventDefault()
      const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9
      const newScale = clamp(
        world.scale.x * zoomFactor,
        GRAPH_CONFIG.zoom.min,
        GRAPH_CONFIG.zoom.max,
      )
      const mouse = new PIXI.Point(event.clientX, event.clientY)
      const mouseLocalBeforeScale = world.toLocal(mouse)
      world.scale.set(newScale)
      const mouseLocalAfterScale = world.toLocal(mouse)
      world.x += (mouseLocalAfterScale.x - mouseLocalBeforeScale.x) * world.scale.x
      world.y += (mouseLocalAfterScale.y - mouseLocalBeforeScale.y) * world.scale.y
      onZoom()
    },
    { passive: false },
  )
}

function setupNodeDragAndSelection({
  stage,
  world,
  nodeById,
  selectNode,
  setHoveredNode,
  clearHoveredNode,
  getSelectedNodeId,
  getCanvasCenterGlobal,
  simulation,
}: {
  stage: PIXI.Container
  world: PIXI.Container
  nodeById: ReadonlyMap<NodeId, GraphNode>
  selectNode: (nodeId: NodeId) => void
  setHoveredNode: (nodeId: NodeId) => void
  clearHoveredNode: (nodeId: NodeId) => void
  getSelectedNodeId: () => NodeId | null
  getCanvasCenterGlobal: () => Point
  simulation: d3.Simulation<GraphNode, SimulationGraphLink>
}): RegisterNodeInteraction {
  const interactionRegistry = AtomRegistry.make()
  const interactionStateAtom = Atom.make<SpriteInteractionState>({
    drag: { type: "idle" },
    pointerGlobal: null,
    selectionRequestNodeId: null,
    selectionRequestId: 0,
  }).pipe(Atom.keepAlive)

  const dispatch = (action: SpriteInteractionAction) => {
    interactionRegistry.update(interactionStateAtom, (state) =>
      reduceSpriteInteractionState(state, action),
    )
  }
  const isDragActive = () =>
    isDraggingInteractionState(interactionRegistry.get(interactionStateAtom))

  let previousState = interactionRegistry.get(interactionStateAtom)
  interactionRegistry.subscribe(interactionStateAtom, (state) => {
    if (hasAdvancedSelectionRequest(previousState, state)) {
      selectNode(state.selectionRequestNodeId)
    }

    const dragTransition = toDragLifecycleTransition(previousState, state)
    if (dragTransition.type === "started") {
      simulation.alphaTarget(GRAPH_CONFIG.physics.dragAlphaTarget).restart()
    } else if (dragTransition.type === "ended") {
      simulation.alphaTarget(GRAPH_CONFIG.physics.idleAlphaTarget)
      clearHoveredNode(dragTransition.nodeId)
      releaseDraggedNode(dragTransition.nodeId, nodeById)
    }

    syncDraggedNodeToPointer({ state, nodeById, world })

    const didCenter = centerSelectedReleasedNode({
      previousState,
      state,
      selectedNodeId: getSelectedNodeId(),
      nodeById,
      world,
      getCanvasCenterGlobal,
    })
    if (didCenter) {
      simulation.alpha(GRAPH_CONFIG.physics.selectedCenterReheatAlpha).restart()
    }

    previousState = state
  })

  stage.on("pointermove", (event: PIXI.FederatedPointerEvent) => {
    dispatch({ type: "drag/move", global: toGlobalPoint(event) })
  })

  onPointerRelease(stage, () => {
    dispatch({ type: "drag/end" })
  })

  return (node, nodeSprite) => {
    nodeSprite.onPointerOver(() => {
      if (isDragActive()) return
      setHoveredNode(node.id)
    })
    nodeSprite.onPointerOut(() => {
      clearHoveredNode(node.id)
    })

    nodeSprite.onPointerDown((event: PIXI.FederatedPointerEvent) => {
      event.stopPropagation()
      clearHoveredNode(node.id)
      dispatch({ type: "drag/start", nodeId: node.id, global: toGlobalPoint(event) })
    })
  }
}

async function main() {
  const graph = await loadGraphDataFromSnapshot(new URL("./graph-snapshot.json", import.meta.url))
  const app = await createPixiApp("#app")
  const { world, edgeGraphics, nodeLayer, labelLayer } = createWorld(app)

  const context: GraphReducerContext = {
    nodes: graph.nodes,
    links: graph.links,
    nodeById: graph.nodeById,
    adjacency: graph.adjacency,
  }

  const graphRegistry = AtomRegistry.make()
  const graphStateAtom = Atom.make<GraphState>(createGraphState(null, null, context)).pipe(
    Atom.keepAlive,
  )
  const dispatch = (action: GraphAction) => {
    graphRegistry.update(graphStateAtom, (state) => reduceGraphState(state, action, context))
  }

  const simulationController = createSimulation({
    nodes: graph.nodes,
    links: graph.links,
    nodeById: graph.nodeById,
    adjacency: graph.adjacency,
  })
  const { simulation } = simulationController
  const registerNodeInteraction = setupNodeDragAndSelection({
    stage: app.stage,
    world,
    nodeById: graph.nodeById,
    selectNode: (nodeId) => dispatch({ type: "selection/set", nodeId }),
    setHoveredNode: (nodeId) => dispatch({ type: "hover/set", nodeId }),
    clearHoveredNode: (nodeId) => dispatch({ type: "hover/clear", nodeId }),
    getSelectedNodeId: () =>
      selectedNodeIdFromSelection(graphRegistry.get(graphStateAtom).selection),
    getCanvasCenterGlobal: () => ({ x: app.screen.width / 2, y: app.screen.height / 2 }),
    simulation,
  })

  const renderer = createGraphRenderer({
    nodes: graph.nodes,
    nodeLayer,
    labelLayer,
    edgeGraphics,
    ticker: app.ticker,
    registerNodeInteraction,
  })

  let previousSelectedNodeId = selectedNodeIdFromSelection(
    graphRegistry.get(graphStateAtom).selection,
  )
  simulationController.setSelectedNodeId(previousSelectedNodeId)
  graphRegistry.subscribe(graphStateAtom, (state) => {
    renderer.render(state.renderModel)
    const selectedNodeId = selectedNodeIdFromSelection(state.selection)
    if (selectedNodeId === previousSelectedNodeId) return
    previousSelectedNodeId = selectedNodeId
    simulationController.setSelectedNodeId(selectedNodeId)
    simulation.alpha(GRAPH_CONFIG.physics.selectedCenterReheatAlpha).restart()
  })

  simulation.on("tick", () => {
    simulationController.syncSelectedLayoutCenter()
    dispatch({ type: "simulation/tick" })
  })

  setupPanAndZoom({
    app,
    world,
    onBackgroundPointerDown: () => {},
    onZoom: () => renderer.render(graphRegistry.get(graphStateAtom).renderModel),
  })

  window.addEventListener("resize", () => {
    simulation.force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
    simulation.alpha(0.3).restart()
  })

  const randomNode = graph.nodes[Math.floor(Math.random() * graph.nodes.length)]
  if (randomNode) dispatch({ type: "selection/set", nodeId: randomNode.id })
  renderer.render(graphRegistry.get(graphStateAtom).renderModel)
}

const isBrowserRuntime = typeof window !== "undefined" && typeof document !== "undefined"

if (isBrowserRuntime) {
  main().catch((error: unknown) => {
    console.error(error)
  })
}
