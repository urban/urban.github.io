import type { Simulation } from "d3-force"
import type { GraphSnapshotNode } from "@urban/build-graph/schema"
import { createAppState, reduceAppStateWithCommands } from "./app-state"
import { bindPointerInteractions } from "./interaction"
import { createLifecycle } from "./lifecycle"
import { applyAppTheme, createGraphRenderer, createPixiApp, createWorld } from "./renderer"
import { centerReleasedSelectedNode, createSimulation, toViewportCenter } from "./simulation"
import {
  createGraphDataFromSnapshotPayload,
  loadGraphDataFromSnapshot,
  toSnapshotNodeLabel,
} from "./state"
import {
  GRAPH_CONFIG,
  resolveGraphTheme,
  selectedNodeIdFromSelection,
  type AppAction,
  type AppCommand,
  type GraphNode,
  type NodeId,
  type SimulationGraphLink,
} from "./shared"

const DEFAULT_GRAPH_SNAPSHOT_SCRIPT_ID = "graph-snapshot"

export type HtmlGraphSnapshotSource =
  | { type: "snapshot-url"; snapshotUrl: URL }
  | { type: "snapshot-inline"; snapshotPayload: unknown }

export type GraphVisualizerStaticLayoutEntry = {
  nodeId: NodeId
  x: number
  y: number
}

export type GraphVisualizerHandle = {
  getNodePosition: (nodeId: NodeId) => { x: number; y: number } | null
  getCanvasClientRect: () => DOMRect
  applyStaticLayout: (layout: ReadonlyArray<GraphVisualizerStaticLayoutEntry>) => void
  hoverNode: (nodeId: NodeId | null) => void
  selectNode: (nodeId: NodeId) => void
  settleLayout: (tickCount?: number) => void
}

export type GraphVisualizerBootstrapOptions = {
  onSelectionChange?: (selection: GraphVisualizerSelectionChange) => void
  onReady?: (handle: GraphVisualizerHandle) => void
  disableAnimations?: boolean
  selectedNodeId?: NodeId | null
  documentObject?: Document
}

export type GraphVisualizerNoSelectionChange = { type: "none" }

export type GraphVisualizerNoteSelectionChange = {
  type: "note"
  nodeId: NodeId
  displayLabel: string
  relativePath: string
  permalink: string
  sourceRelativePath?: string
  slug?: string
  routePath?: string
  title?: string
  description?: string
  created?: string
  updated?: string
  aliases: ReadonlyArray<string>
  published?: boolean
}

export type GraphVisualizerPlaceholderSelectionChange = {
  type: "placeholder"
  nodeId: NodeId
  displayLabel: string
  unresolvedTarget: string
}

export type GraphVisualizerSelectionChange =
  | GraphVisualizerNoSelectionChange
  | GraphVisualizerNoteSelectionChange
  | GraphVisualizerPlaceholderSelectionChange

export function createGraphVisualizerSelectionChange({
  selectedNodeId,
  snapshotNodeById,
}: {
  selectedNodeId: NodeId | null
  snapshotNodeById: ReadonlyMap<NodeId, GraphSnapshotNode>
}): GraphVisualizerSelectionChange {
  if (selectedNodeId === null) {
    return { type: "none" }
  }

  const snapshotNode = snapshotNodeById.get(selectedNodeId)
  if (snapshotNode === undefined) {
    return { type: "none" }
  }

  if (snapshotNode.kind === "placeholder") {
    return {
      type: "placeholder",
      nodeId: snapshotNode.id,
      displayLabel: toSnapshotNodeLabel(snapshotNode),
      unresolvedTarget: snapshotNode.unresolvedTarget,
    }
  }

  return {
    type: "note",
    nodeId: snapshotNode.id,
    displayLabel: toSnapshotNodeLabel(snapshotNode),
    relativePath: snapshotNode.relativePath,
    permalink: snapshotNode.permalink,
    aliases: snapshotNode.aliases ?? [],
    ...(snapshotNode.sourceRelativePath === undefined
      ? {}
      : { sourceRelativePath: snapshotNode.sourceRelativePath }),
    ...(snapshotNode.slug === undefined ? {} : { slug: snapshotNode.slug }),
    ...(snapshotNode.routePath === undefined ? {} : { routePath: snapshotNode.routePath }),
    ...(snapshotNode.title === undefined ? {} : { title: snapshotNode.title }),
    ...(snapshotNode.description === undefined ? {} : { description: snapshotNode.description }),
    ...(snapshotNode.created === undefined ? {} : { created: snapshotNode.created }),
    ...(snapshotNode.updated === undefined ? {} : { updated: snapshotNode.updated }),
    ...(snapshotNode.published === undefined ? {} : { published: snapshotNode.published }),
  }
}

export function resolveGraphSnapshotSourceFromHtmlConfig({
  snapshotUrl,
  snapshotJson,
  baseUrl,
}: {
  snapshotUrl: string | null
  snapshotJson: string | null
  baseUrl: string
}): HtmlGraphSnapshotSource {
  if (snapshotUrl !== null && snapshotJson !== null) {
    throw new Error(
      "Ambiguous graph snapshot source: provide either data-graph-snapshot-url or inline script JSON, not both.",
    )
  }

  if (snapshotUrl !== null) {
    return { type: "snapshot-url", snapshotUrl: new URL(snapshotUrl, baseUrl) }
  }

  if (snapshotJson !== null) {
    try {
      const snapshotPayload: unknown = JSON.parse(snapshotJson)
      return { type: "snapshot-inline", snapshotPayload }
    } catch (error: unknown) {
      throw new Error(
        `Invalid graph snapshot JSON in HTML: ${
          error instanceof Error ? error.message : "unknown parse error"
        }`,
      )
    }
  }

  throw new Error(
    'Missing graph snapshot source in HTML. Set #app[data-graph-snapshot-url] or add <script id="graph-snapshot" type="application/json">...</script>.',
  )
}

export function resolveInitialSelectedNodeIdFromHtmlConfig(
  selectedNodeId: string | null | undefined,
): NodeId | null {
  if (selectedNodeId === null || selectedNodeId === undefined) {
    return null
  }

  const normalizedSelectedNodeId = selectedNodeId.trim()
  return normalizedSelectedNodeId === "" ? null : normalizedSelectedNodeId
}

function readGraphSnapshotSourceFromDocument(documentObject: Document): HtmlGraphSnapshotSource {
  const appElement = documentObject.getElementById("app")
  if (appElement === null) {
    throw new Error("Missing #app container element for graph visualizer bootstrap.")
  }

  const snapshotUrlValue = appElement.dataset.graphSnapshotUrl?.trim() ?? ""
  const snapshotScriptIdValue = appElement.dataset.graphSnapshotScriptId?.trim()
  if (snapshotUrlValue !== "" && snapshotScriptIdValue !== undefined) {
    throw new Error(
      "Ambiguous graph snapshot source: do not set both data-graph-snapshot-url and data-graph-snapshot-script-id on #app.",
    )
  }

  const snapshotUrl = snapshotUrlValue === "" ? null : snapshotUrlValue
  if (snapshotUrl !== null) {
    return resolveGraphSnapshotSourceFromHtmlConfig({
      snapshotUrl,
      snapshotJson: null,
      baseUrl: documentObject.baseURI,
    })
  }

  const snapshotScriptId = snapshotScriptIdValue ?? DEFAULT_GRAPH_SNAPSHOT_SCRIPT_ID
  const snapshotScriptElement = documentObject.getElementById(snapshotScriptId)
  const snapshotScriptText = snapshotScriptElement?.textContent?.trim() ?? ""

  return resolveGraphSnapshotSourceFromHtmlConfig({
    snapshotUrl: null,
    snapshotJson: snapshotScriptText === "" ? null : snapshotScriptText,
    baseUrl: documentObject.baseURI,
  })
}

function readInitialSelectedNodeIdFromDocument(documentObject: Document): NodeId | null {
  const appElement = documentObject.getElementById("app")
  if (appElement === null) {
    throw new Error("Missing #app container element for graph visualizer bootstrap.")
  }

  return resolveInitialSelectedNodeIdFromHtmlConfig(appElement.dataset.selectedNodeId)
}

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
  onSelectionChange,
  simulation,
  simulationController,
  snapshotNodeById,
  nodeById,
  world,
  getCanvasCenterGlobal,
}: {
  commands: ReadonlyArray<AppCommand>
  onSelectionChange: ((selection: GraphVisualizerSelectionChange) => void) | undefined
  simulation: Simulation<GraphNode, SimulationGraphLink>
  simulationController: ReturnType<typeof createSimulation>
  nodeById: ReadonlyMap<NodeId, GraphNode>
  snapshotNodeById: ReadonlyMap<NodeId, GraphSnapshotNode>
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
      case "selection/notify-host":
        onSelectionChange?.(
          createGraphVisualizerSelectionChange({
            selectedNodeId: command.selectedNodeId,
            snapshotNodeById,
          }),
        )
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

export async function bootstrapGraphVisualizer({
  onSelectionChange,
  onReady,
  disableAnimations = false,
  selectedNodeId,
  documentObject = document,
}: GraphVisualizerBootstrapOptions = {}) {
  const graphSource = readGraphSnapshotSourceFromDocument(documentObject)
  const graph =
    graphSource.type === "snapshot-url"
      ? await loadGraphDataFromSnapshot(graphSource.snapshotUrl)
      : createGraphDataFromSnapshotPayload(graphSource.snapshotPayload)
  const getTheme = () => resolveGraphTheme(documentObject)
  const app = await createPixiApp({ containerSelector: "#app", theme: getTheme() })
  const graphRootElement = app.canvas.parentElement
  if (!(graphRootElement instanceof HTMLElement)) {
    throw new Error("Missing graph root element for graph visualizer bootstrap.")
  }
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
    initialViewportSize: {
      width: app.screen.width,
      height: app.screen.height,
    },
  })
  const { simulation } = simulationController

  const renderer = createGraphRenderer({
    nodes: graph.nodes,
    nodeLayer,
    labelLayer,
    edgeGraphics,
    ticker: app.ticker,
    getTheme,
    animationsEnabled: !disableAnimations,
  })

  const lifecycle = createLifecycle()
  lifecycle.add(simulationController.dispose)
  lifecycle.add(renderer.dispose)

  const initialSelectedNodeId =
    selectedNodeId === undefined
      ? readInitialSelectedNodeIdFromDocument(documentObject)
      : selectedNodeId
  let appState = createAppState(context, initialSelectedNodeId)
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
      snapshotNodeById: graph.snapshotNodeById,
      onSelectionChange,
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

  const syncSimulationCenterToViewport = () => {
    simulationController.setLayoutCenter(
      toViewportCenter({
        width: app.screen.width,
        height: app.screen.height,
      }),
    )
    simulation.alpha(0.3).restart()
  }

  if (typeof ResizeObserver === "function") {
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(syncSimulationCenterToViewport)
    })
    resizeObserver.observe(graphRootElement)
    lifecycle.add(() => {
      resizeObserver.disconnect()
    })
  } else {
    window.addEventListener("resize", syncSimulationCenterToViewport)
    lifecycle.add(() => {
      window.removeEventListener("resize", syncSimulationCenterToViewport)
    })
  }

  if (typeof MutationObserver === "function") {
    const themeObserver = new MutationObserver(() => {
      applyAppTheme(app, getTheme())
      renderer.render(appState.graph.renderModel)
    })
    themeObserver.observe(documentObject.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-color-scheme"],
    })
    lifecycle.add(() => {
      themeObserver.disconnect()
    })
  }

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

  onReady?.({
    getNodePosition: (nodeId) => {
      const node = graph.nodeById.get(nodeId)
      return typeof node?.x === "number" && typeof node.y === "number"
        ? { x: node.x, y: node.y }
        : null
    },
    getCanvasClientRect: () => app.canvas.getBoundingClientRect(),
    applyStaticLayout: (layout) => {
      simulation.stop()
      for (const entry of layout) {
        const node = graph.nodeById.get(entry.nodeId)
        if (!node) continue
        node.x = entry.x
        node.y = entry.y
        node.vx = 0
        node.vy = 0
        node.fx = entry.x
        node.fy = entry.y
      }
      dispatch({ type: "graph/action", action: { type: "simulation/tick" } })
    },
    hoverNode: (nodeId) => {
      if (nodeId === null) {
        const hoveredNodeId = appState.graph.hoveredNodeId
        if (hoveredNodeId !== null) {
          dispatch({ type: "graph/action", action: { type: "hover/clear", nodeId: hoveredNodeId } })
        }
        return
      }

      dispatch({ type: "graph/action", action: { type: "hover/set", nodeId } })
    },
    selectNode: (nodeId) => {
      dispatch({ type: "graph/action", action: { type: "selection/set", nodeId } })
    },
    settleLayout: (tickCount = 300) => {
      simulation.stop()
      simulation.tick(tickCount)
      dispatch({ type: "graph/action", action: { type: "simulation/tick" } })
    },
  })

  return lifecycle.dispose
}
