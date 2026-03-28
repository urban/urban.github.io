import type { Simulation } from "d3-force"
import { Effect, Schema } from "effect"
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
  DARK_GRAPH_THEME,
  GRAPH_CONFIG,
  LIGHT_GRAPH_THEME,
  resolveGraphTheme,
  selectedNodeIdFromSelection,
  type AppAction,
  type AppCommand,
  type GraphNode,
  type GraphTheme,
  type GraphThemeSet,
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
  themeSet?: GraphThemeSet
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

const GraphThemeNameSchema = Schema.Union([Schema.Literal("light"), Schema.Literal("dark")])

type GraphThemeName = Schema.Schema.Type<typeof GraphThemeNameSchema>

export class GraphThemeJsonParseError extends Schema.TaggedErrorClass<GraphThemeJsonParseError>()(
  "GraphThemeJsonParseError",
  {
    themeName: GraphThemeNameSchema,
    input: Schema.String,
    message: Schema.String,
  },
) {}

export class GraphThemeDecodeError extends Schema.TaggedErrorClass<GraphThemeDecodeError>()(
  "GraphThemeDecodeError",
  {
    themeName: GraphThemeNameSchema,
    message: Schema.String,
  },
) {}

export class GraphVisualizerBootstrapError extends Schema.TaggedErrorClass<GraphVisualizerBootstrapError>()(
  "GraphVisualizerBootstrapError",
  {
    message: Schema.String,
  },
) {}

export type GraphVisualizerBootstrapFailure =
  | GraphThemeJsonParseError
  | GraphThemeDecodeError
  | GraphVisualizerBootstrapError

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

const FontWeightSchema = Schema.Union([
  Schema.Literal("normal"),
  Schema.Literal("bold"),
  Schema.Literal("bolder"),
  Schema.Literal("lighter"),
  Schema.Literal("100"),
  Schema.Literal("200"),
  Schema.Literal("300"),
  Schema.Literal("400"),
  Schema.Literal("500"),
  Schema.Literal("600"),
  Schema.Literal("700"),
  Schema.Literal("800"),
  Schema.Literal("900"),
])

const GraphThemeNodeVariantSchema = Schema.Struct({
  fill: Schema.Number,
  stroke: Schema.Number,
  strokeWidth: Schema.Number,
  alpha: Schema.Number,
})

const GraphThemeLabelVariantSchema = Schema.Struct({
  fill: Schema.Number,
  alpha: Schema.Number,
})

const GraphThemeSchema = Schema.Struct({
  view: Schema.Struct({
    backgroundColor: Schema.Number,
  }),
  node: Schema.Struct({
    variants: Schema.Struct({
      default: GraphThemeNodeVariantSchema,
      selected: GraphThemeNodeVariantSchema,
      muted: GraphThemeNodeVariantSchema,
    }),
    scales: Schema.Struct({
      default: Schema.Number,
      selected: Schema.Number,
      muted: Schema.Number,
    }),
  }),
  edge: Schema.Struct({
    variants: Schema.Struct({
      default: Schema.Struct({
        width: Schema.Number,
        color: Schema.Number,
        alpha: Schema.Number,
      }),
      muted: Schema.Struct({
        width: Schema.Number,
        color: Schema.Number,
        alpha: Schema.Number,
      }),
    }),
  }),
  label: Schema.Struct({
    variants: Schema.Struct({
      default: GraphThemeLabelVariantSchema,
      selected: GraphThemeLabelVariantSchema,
      muted: GraphThemeLabelVariantSchema,
    }),
    style: Schema.Struct({
      fontFamily: Schema.optional(Schema.String),
      fontSize: Schema.optional(Schema.Number),
      fontWeight: Schema.optional(FontWeightSchema),
    }),
  }),
})

type GraphThemePayload = Schema.Schema.Type<typeof GraphThemeSchema>

function toGraphTheme(payload: GraphThemePayload): GraphTheme {
  return {
    ...payload,
    label: {
      ...payload.label,
      style: {
        ...(payload.label.style.fontFamily === undefined
          ? {}
          : { fontFamily: payload.label.style.fontFamily }),
        ...(payload.label.style.fontSize === undefined
          ? {}
          : { fontSize: payload.label.style.fontSize }),
        ...(payload.label.style.fontWeight === undefined
          ? {}
          : { fontWeight: payload.label.style.fontWeight }),
      },
    },
  }
}

const parseGraphThemeJson = Effect.fn("parseGraphThemeJson")(function* (
  themeJson: string,
  themeName: GraphThemeName,
): Effect.fn.Return<unknown, GraphThemeJsonParseError> {
  return yield* Effect.try({
    try: () => JSON.parse(themeJson) as unknown,
    catch: (error: unknown) =>
      new GraphThemeJsonParseError({
        themeName,
        input: themeJson,
        message: error instanceof Error ? error.message : "unknown parse error",
      }),
  })
})

const decodeGraphTheme = Effect.fn("decodeGraphTheme")(function* (
  value: unknown,
  themeName: GraphThemeName,
): Effect.fn.Return<GraphTheme, GraphThemeDecodeError> {
  const payload = yield* Schema.decodeUnknownEffect(GraphThemeSchema)(value).pipe(
    Effect.mapError(
      (error) =>
        new GraphThemeDecodeError({
          themeName,
          message: error.message,
        }),
    ),
  )

  return toGraphTheme(payload)
})

const parseOptionalGraphThemeJson = Effect.fn("parseOptionalGraphThemeJson")(function* (
  themeJson: string | null | undefined,
  themeName: GraphThemeName,
): Effect.fn.Return<GraphTheme | null, GraphThemeJsonParseError | GraphThemeDecodeError> {
  const normalizedThemeJson = themeJson?.trim() ?? ""
  if (normalizedThemeJson === "") {
    return null
  }

  const payload = yield* parseGraphThemeJson(normalizedThemeJson, themeName)
  return yield* decodeGraphTheme(payload, themeName)
})

export const resolveGraphThemeSetFromHtmlConfigEffect = Effect.fn(
  "resolveGraphThemeSetFromHtmlConfigEffect",
)(function* ({
  lightThemeJson,
  darkThemeJson,
}: {
  lightThemeJson: string | null | undefined
  darkThemeJson: string | null | undefined
}): Effect.fn.Return<GraphThemeSet, GraphThemeJsonParseError | GraphThemeDecodeError> {
  return {
    light: (yield* parseOptionalGraphThemeJson(lightThemeJson, "light")) ?? LIGHT_GRAPH_THEME,
    dark: (yield* parseOptionalGraphThemeJson(darkThemeJson, "dark")) ?? DARK_GRAPH_THEME,
  }
})

export function resolveGraphThemeSetFromHtmlConfig({
  lightThemeJson,
  darkThemeJson,
}: {
  lightThemeJson: string | null | undefined
  darkThemeJson: string | null | undefined
}): GraphThemeSet {
  try {
    return Effect.runSync(
      resolveGraphThemeSetFromHtmlConfigEffect({
        lightThemeJson,
        darkThemeJson,
      }),
    )
  } catch (error: unknown) {
    if (error instanceof GraphThemeJsonParseError || error instanceof GraphThemeDecodeError) {
      throw new Error(`Invalid ${error.themeName} graph theme JSON: ${error.message}`)
    }

    throw error
  }
}

const readGraphThemeSetFromDocumentEffect = Effect.fn("readGraphThemeSetFromDocumentEffect")(
  function* (
    documentObject: Document,
  ): Effect.fn.Return<
    GraphThemeSet,
    GraphThemeJsonParseError | GraphThemeDecodeError | GraphVisualizerBootstrapError
  > {
    const appElement = documentObject.getElementById("app")
    if (appElement === null) {
      return yield* new GraphVisualizerBootstrapError({
        message: "Missing #app container element for graph visualizer bootstrap.",
      })
    }

    return yield* resolveGraphThemeSetFromHtmlConfigEffect({
      lightThemeJson: appElement.dataset.lightGraphTheme,
      darkThemeJson: appElement.dataset.darkGraphTheme,
    })
  },
)

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

const readGraphSnapshotSourceFromDocumentEffect = Effect.fn(
  "readGraphSnapshotSourceFromDocumentEffect",
)(function* (
  documentObject: Document,
): Effect.fn.Return<HtmlGraphSnapshotSource, GraphVisualizerBootstrapError> {
  return yield* Effect.try({
    try: () => readGraphSnapshotSourceFromDocument(documentObject),
    catch: (error: unknown) =>
      new GraphVisualizerBootstrapError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to read the graph snapshot source from HTML.",
      }),
  })
})

const readInitialSelectedNodeIdFromDocumentEffect = Effect.fn(
  "readInitialSelectedNodeIdFromDocumentEffect",
)(function* (
  documentObject: Document,
): Effect.fn.Return<NodeId | null, GraphVisualizerBootstrapError> {
  return yield* Effect.try({
    try: () => readInitialSelectedNodeIdFromDocument(documentObject),
    catch: (error: unknown) =>
      new GraphVisualizerBootstrapError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to read the initial selected node id from HTML.",
      }),
  })
})

const loadGraphDataEffect = Effect.fn("loadGraphDataEffect")(function* (
  graphSource: HtmlGraphSnapshotSource,
): Effect.fn.Return<
  ReturnType<typeof createGraphDataFromSnapshotPayload>,
  GraphVisualizerBootstrapError
> {
  if (graphSource.type === "snapshot-inline") {
    return yield* Effect.try({
      try: () => createGraphDataFromSnapshotPayload(graphSource.snapshotPayload),
      catch: (error: unknown) =>
        new GraphVisualizerBootstrapError({
          message:
            error instanceof Error ? error.message : "Failed to decode the inline graph snapshot.",
        }),
    })
  }

  return yield* Effect.tryPromise({
    try: () => loadGraphDataFromSnapshot(graphSource.snapshotUrl),
    catch: (error: unknown) =>
      new GraphVisualizerBootstrapError({
        message: error instanceof Error ? error.message : "Failed to load the graph snapshot.",
      }),
  })
})

const createPixiAppEffect = Effect.fn("createPixiAppEffect")(function* ({
  containerSelector,
  theme,
}: {
  containerSelector: string
  theme: GraphTheme
}): Effect.fn.Return<Awaited<ReturnType<typeof createPixiApp>>, GraphVisualizerBootstrapError> {
  return yield* Effect.tryPromise({
    try: () => createPixiApp({ containerSelector, theme }),
    catch: (error: unknown) =>
      new GraphVisualizerBootstrapError({
        message: error instanceof Error ? error.message : "Failed to create the graph canvas.",
      }),
  })
})

export const bootstrapGraphVisualizerEffect = Effect.fn("bootstrapGraphVisualizerEffect")(
  function* ({
    onSelectionChange,
    onReady,
    disableAnimations = false,
    selectedNodeId,
    themeSet,
    documentObject = document,
  }: GraphVisualizerBootstrapOptions = {}): Effect.fn.Return<
    () => void,
    GraphVisualizerBootstrapFailure
  > {
    const graphSource = yield* readGraphSnapshotSourceFromDocumentEffect(documentObject)
    const graphThemes = themeSet ?? (yield* readGraphThemeSetFromDocumentEffect(documentObject))
    const graph = yield* loadGraphDataEffect(graphSource)
    const getTheme = () => resolveGraphTheme(documentObject, graphThemes)
    const app = yield* createPixiAppEffect({ containerSelector: "#app", theme: getTheme() })
    const graphRootElement = app.canvas.parentElement
    if (!(graphRootElement instanceof HTMLElement)) {
      return yield* new GraphVisualizerBootstrapError({
        message: "Missing graph root element for graph visualizer bootstrap.",
      })
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
        ? yield* readInitialSelectedNodeIdFromDocumentEffect(documentObject)
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
            dispatch({
              type: "graph/action",
              action: { type: "hover/clear", nodeId: hoveredNodeId },
            })
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
  },
)

export async function bootstrapGraphVisualizer(options: GraphVisualizerBootstrapOptions = {}) {
  return await Effect.runPromise(bootstrapGraphVisualizerEffect(options))
}

export function toGraphVisualizerBootstrapUserMessage(
  error: GraphVisualizerBootstrapFailure,
): string {
  switch (error._tag) {
    case "GraphThemeJsonParseError":
      return `The ${error.themeName} graph theme could not be loaded because its JSON is invalid.`
    case "GraphThemeDecodeError":
      return `The ${error.themeName} graph theme could not be loaded because it does not match the expected shape.`
    case "GraphVisualizerBootstrapError":
      return `The graph could not be loaded. ${error.message}`
  }
}

export function renderGraphVisualizerBootstrapError({
  documentObject,
  error,
}: {
  documentObject: Document
  error: GraphVisualizerBootstrapFailure
}) {
  const hostElement = documentObject.getElementById("app") ?? documentObject.body
  if (!(hostElement instanceof HTMLElement)) {
    return
  }

  hostElement.replaceChildren()
  hostElement.setAttribute("data-graph-bootstrap-state", "error")
  hostElement.style.display = "grid"
  hostElement.style.placeItems = "center"
  hostElement.style.padding = "24px"

  const panelElement = documentObject.createElement("div")
  panelElement.setAttribute("role", "alert")
  panelElement.style.maxWidth = "40rem"
  panelElement.style.padding = "16px 20px"
  panelElement.style.borderRadius = "12px"
  panelElement.style.border = "1px solid rgba(127, 29, 29, 0.18)"
  panelElement.style.background = "rgba(254, 242, 242, 0.92)"
  panelElement.style.color = "#7f1d1d"
  panelElement.style.fontFamily = "Inter, system-ui, sans-serif"
  panelElement.style.lineHeight = "1.5"

  const titleElement = documentObject.createElement("strong")
  titleElement.textContent = "Graph unavailable"
  titleElement.style.display = "block"
  titleElement.style.marginBottom = "8px"

  const messageElement = documentObject.createElement("p")
  messageElement.textContent = toGraphVisualizerBootstrapUserMessage(error)
  messageElement.style.margin = "0"

  panelElement.append(titleElement, messageElement)
  hostElement.append(panelElement)
}
