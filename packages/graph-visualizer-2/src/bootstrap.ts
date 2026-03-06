import * as d3 from "d3-force"
import { createAppState, reduceAppStateWithCommands } from "./app-state"
import { bindPointerInteractions } from "./interaction"
import { createLifecycle } from "./lifecycle"
import { createGraphRenderer, createPixiApp, createWorld } from "./renderer"
import { centerReleasedSelectedNode, createSimulation } from "./simulation"
import { loadGraphDataFromSnapshot } from "./state"
import {
  GRAPH_CONFIG,
  selectedNodeIdFromSelection,
  type AppAction,
  type AppCommand,
  type GraphNode,
  type NodeId,
  type SimulationGraphLink,
} from "./shared"

function setNodeFixedToPointer({
  nodeId,
  pointerGlobal,
  nodeById,
  world,
}: {
  nodeId: NodeId
  pointerGlobal: { x: number; y: number }
  nodeById: ReadonlyMap<NodeId, GraphNode>
  world: { toLocal: (point: { x: number; y: number }) => { x: number; y: number } }
}) {
  const dragNode = nodeById.get(nodeId)
  if (!dragNode) return
  const position = world.toLocal(pointerGlobal)
  dragNode.fx = position.x
  dragNode.fy = position.y
}

function releaseFixedNode(nodeId: NodeId, nodeById: ReadonlyMap<NodeId, GraphNode>) {
  const releasedNode = nodeById.get(nodeId)
  if (!releasedNode) return
  releasedNode.fx = null
  releasedNode.fy = null
}

function executeAppCommands({
  commands,
  simulation,
  simulationController,
  nodeById,
  world,
  getCanvasCenterGlobal,
}: {
  commands: ReadonlyArray<AppCommand>
  simulation: d3.Simulation<GraphNode, SimulationGraphLink>
  simulationController: ReturnType<typeof createSimulation>
  nodeById: ReadonlyMap<NodeId, GraphNode>
  world: {
    x: number
    y: number
    position: { set: (x: number, y: number) => void }
    toLocal: (point: { x: number; y: number }) => { x: number; y: number }
  }
  getCanvasCenterGlobal: () => { x: number; y: number }
}) {
  for (const command of commands) {
    switch (command.type) {
      case "simulation/sync-selected-layout-center":
        simulationController.syncSelectedLayoutCenter()
        break
      case "simulation/set-selected-node":
        simulationController.setSelectedNodeId(command.nodeId)
        break
      case "simulation/reheat":
        simulation.alpha(command.alpha).restart()
        break
      case "simulation/alpha-target": {
        simulation.alphaTarget(command.alphaTarget)
        if (command.restart) {
          simulation.restart()
        }
        break
      }
      case "world/set-position":
        world.position.set(command.position.x, command.position.y)
        break
      case "drag/set-node-fixed-position":
        setNodeFixedToPointer({
          nodeId: command.nodeId,
          pointerGlobal: command.pointerGlobal,
          nodeById,
          world,
        })
        break
      case "drag/release-node-fixed-position":
        releaseFixedNode(command.nodeId, nodeById)
        break
      case "drag/center-released-selected-node": {
        const didCenter = centerReleasedSelectedNode({
          releasedNodeId: command.releasedNodeId,
          selectedNodeId: command.selectedNodeId,
          nodeById,
          world,
          getCanvasCenterGlobal,
        })
        if (didCenter) {
          simulation.alpha(GRAPH_CONFIG.physics.selectedCenterReheatAlpha).restart()
        }
        break
      }
    }
  }
}

export async function bootstrapGraphVisualizer() {
  const graph = await loadGraphDataFromSnapshot(new URL("./graph-snapshot.json", import.meta.url))
  const app = await createPixiApp("#app")
  const { world, edgeGraphics, nodeLayer, labelLayer } = createWorld(app)

  const context = {
    nodes: graph.nodes,
    links: graph.links,
    nodeById: graph.nodeById,
    adjacency: graph.adjacency,
  }

  const simulationController = createSimulation({
    nodes: graph.nodes,
    links: graph.links,
    nodeById: graph.nodeById,
    adjacency: graph.adjacency,
  })
  const { simulation } = simulationController

  const renderer = createGraphRenderer({
    nodes: graph.nodes,
    nodeLayer,
    labelLayer,
    edgeGraphics,
    ticker: app.ticker,
  })

  const lifecycle = createLifecycle()
  lifecycle.add(simulationController.dispose)
  lifecycle.add(renderer.dispose)

  let appState = createAppState(context)
  simulationController.setSelectedNodeId(selectedNodeIdFromSelection(appState.graph.selection))

  const dispatch = (action: AppAction) => {
    const reduced = reduceAppStateWithCommands(appState, action, context)
    if (reduced.state === appState && reduced.commands.length === 0) {
      return
    }

    const previousState = appState
    appState = reduced.state

    executeAppCommands({
      commands: reduced.commands,
      simulation,
      simulationController,
      nodeById: graph.nodeById,
      world,
      getCanvasCenterGlobal: () => ({ x: app.screen.width / 2, y: app.screen.height / 2 }),
    })

    if (previousState.graph !== appState.graph) {
      renderer.render(appState.graph.renderModel)
    }
  }

  const onSimulationTick = () => {
    dispatch({ type: "graph/action", action: { type: "simulation/tick" } })
  }
  simulation.on("tick", onSimulationTick)

  const onResize = () => {
    simulation.force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
    simulation.alpha(0.3).restart()
  }
  window.addEventListener("resize", onResize)
  lifecycle.add(() => {
    window.removeEventListener("resize", onResize)
  })

  lifecycle.add(
    bindPointerInteractions({
      app,
      world,
      nodes: graph.nodes,
      nodeSprites: renderer.nodeSprites,
      dispatch,
      onZoom: () => renderer.render(appState.graph.renderModel),
    }),
  )

  renderer.render(appState.graph.renderModel)

  return lifecycle.dispose
}
