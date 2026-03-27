import * as d3 from "d3-force"
import {
  GRAPH_CONFIG,
  type GraphLink,
  type GraphNode,
  type GraphSimulationController,
  type LocalCoordinateSpace,
  type NodeId,
  type Point,
  type Size,
  type SimulationGraphLink,
  hasPosition,
} from "./shared"

function toSimulationLink(link: GraphLink): SimulationGraphLink {
  return {
    sourceNodeId: link.sourceNodeId,
    targetNodeId: link.targetNodeId,
    source: link.sourceNodeId,
    target: link.targetNodeId,
  }
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

export const toViewportCenter = ({ width, height }: Size): Point => ({
  x: width / 2,
  y: height / 2,
})

export function createSimulation({
  nodes,
  links,
  nodeById,
  adjacency,
  initialViewportSize,
}: {
  nodes: GraphNode[]
  links: readonly GraphLink[]
  nodeById: ReadonlyMap<NodeId, GraphNode>
  adjacency: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
  initialViewportSize: Size
}): GraphSimulationController {
  const maxNodeVisualRadius = Math.max(
    GRAPH_CONFIG.physics.collisionRadius,
    GRAPH_CONFIG.node.radius * GRAPH_CONFIG.node.maxScale + GRAPH_CONFIG.node.maxStrokeWidth / 2,
  )

  let selectedNodeId: NodeId | null = null
  const initialViewportCenter = toViewportCenter(initialViewportSize)
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
      initialViewportCenter.x,
      initialViewportCenter.y,
    )
    .strength((node) => {
      if (selectedNodeId === null || node.id === selectedNodeId) return 0
      const selectedNodeNeighbors = adjacency.get(selectedNodeId)
      return selectedNodeNeighbors?.has(node.id) === true
        ? GRAPH_CONFIG.physics.selectedNeighborRingStrength
        : 0
    })

  const centerForce = d3.forceCenter(initialViewportCenter.x, initialViewportCenter.y)

  const simulation = d3
    .forceSimulation(nodes)
    .randomSource(createSeededRandom(0xdecafbad))
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
    .force("center", centerForce)

  const syncSelectedLayoutCenter = () => {
    if (selectedNodeId === null) return
    const selectedNode = nodeById.get(selectedNodeId)
    if (!selectedNode || !hasPosition(selectedNode)) return
    selectedNeighborRingForce.x(selectedNode.x)
    selectedNeighborRingForce.y(selectedNode.y)
  }

  return {
    simulation,
    setLayoutCenter: (center) => {
      centerForce.x(center.x)
      centerForce.y(center.y)
    },
    setSelectedNodeId: (nextSelectedNodeId) => {
      selectedNodeId =
        nextSelectedNodeId !== null && nodeById.has(nextSelectedNodeId) ? nextSelectedNodeId : null
      syncSelectedLayoutCenter()
    },
    syncSelectedLayoutCenter,
    dispose: () => {
      simulation.on("tick", null)
      simulation.stop()
    },
  }
}

export function centerReleasedSelectedNode({
  releasedNodeId,
  selectedNodeId,
  nodeById,
  world,
  getCanvasCenterGlobal,
}: {
  releasedNodeId: NodeId
  selectedNodeId: NodeId | null
  nodeById: ReadonlyMap<NodeId, GraphNode>
  world: LocalCoordinateSpace
  getCanvasCenterGlobal: () => Point
}): boolean {
  if (selectedNodeId !== releasedNodeId) return false

  const selectedNode = nodeById.get(releasedNodeId)
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
