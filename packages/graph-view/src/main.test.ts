import { describe, expect, test } from "bun:test"
import type { GraphSnapshot } from "@urban/build-graph/schema"
import { createGraphVisualizerSelectionChange } from "./bootstrap"
import {
  centerReleasedSelectedNode,
  createGraphDataFromSnapshotPayload,
  createAppState,
  deriveRenderModel,
  reduceAppStateWithCommands,
  reduceGraphState,
  reduceGraphStateWithCommands,
  reduceGraphStateWithTransition,
  resolveInitialSelectedNodeIdFromHtmlConfig,
  resolveGraphSnapshotSourceFromHtmlConfig,
  type AppCommand,
  type GraphLink,
  type GraphNode,
  type GraphReducerContext,
  type GraphState,
  type SelectionSnapshot,
} from "./main"
import { scaleWorldAroundAnchor } from "./interaction"
import { createSimulation, toViewportCenter } from "./simulation"

function makeSnapshotPayload(): GraphSnapshot {
  return {
    schemaVersion: "2",
    nodes: [
      {
        id: "alpha",
        kind: "note",
        relativePath: "alpha.md",
        permalink: "/alpha/",
        slug: "alpha",
        routePath: "/vault/alpha",
        label: "Alpha Label",
        title: "Alpha Title",
        aliases: ["alpha-alias"],
        published: true,
      },
      {
        id: "beta",
        kind: "note",
        relativePath: "beta.md",
        permalink: "/beta/",
        slug: "beta",
        routePath: "/vault/beta",
      },
    ],
    edges: [
      {
        sourceNodeId: "alpha",
        targetNodeId: "beta",
        sourceRelativePath: "alpha.md",
        rawWikilink: "[[beta]]",
        target: "beta",
        resolutionStrategy: "path",
      },
    ],
    diagnostics: [],
    indexes: {
      nodesById: {
        alpha: {
          id: "alpha",
          kind: "note",
          relativePath: "alpha.md",
          permalink: "/alpha/",
          slug: "alpha",
          routePath: "/vault/alpha",
          label: "Alpha Label",
          title: "Alpha Title",
          aliases: ["alpha-alias"],
          published: true,
        },
        beta: {
          id: "beta",
          kind: "note",
          relativePath: "beta.md",
          permalink: "/beta/",
          slug: "beta",
          routePath: "/vault/beta",
        },
      },
      edgesBySourceNodeId: {
        alpha: [
          {
            sourceNodeId: "alpha",
            targetNodeId: "beta",
            sourceRelativePath: "alpha.md",
            rawWikilink: "[[beta]]",
            target: "beta",
            resolutionStrategy: "path",
          },
        ],
      },
      edgesByTargetNodeId: {
        beta: [
          {
            sourceNodeId: "alpha",
            targetNodeId: "beta",
            sourceRelativePath: "alpha.md",
            rawWikilink: "[[beta]]",
            target: "beta",
            resolutionStrategy: "path",
          },
        ],
      },
    },
  }
}

function makeSnapshotPayloadWithPlaceholder(): GraphSnapshot {
  return {
    schemaVersion: "2",
    nodes: [
      {
        id: "alpha",
        kind: "note",
        relativePath: "alpha.md",
        permalink: "/alpha/",
      },
      {
        id: "ghost",
        kind: "placeholder",
        unresolvedTarget: "ghost-note",
      },
    ],
    edges: [
      {
        sourceNodeId: "alpha",
        targetNodeId: "ghost",
        sourceRelativePath: "alpha.md",
        rawWikilink: "[[ghost-note]]",
        target: "ghost-note",
        resolutionStrategy: "unresolved",
      },
    ],
    diagnostics: [
      {
        type: "unresolved-wikilink",
        sourceRelativePath: "alpha.md",
        rawWikilink: "[[ghost-note]]",
        target: "ghost-note",
        placeholderNodeId: "ghost",
      },
    ],
    indexes: {
      nodesById: {
        alpha: {
          id: "alpha",
          kind: "note",
          relativePath: "alpha.md",
          permalink: "/alpha/",
        },
        ghost: {
          id: "ghost",
          kind: "placeholder",
          unresolvedTarget: "ghost-note",
        },
      },
      edgesBySourceNodeId: {
        alpha: [
          {
            sourceNodeId: "alpha",
            targetNodeId: "ghost",
            sourceRelativePath: "alpha.md",
            rawWikilink: "[[ghost-note]]",
            target: "ghost-note",
            resolutionStrategy: "unresolved",
          },
        ],
      },
      edgesByTargetNodeId: {
        ghost: [
          {
            sourceNodeId: "alpha",
            targetNodeId: "ghost",
            sourceRelativePath: "alpha.md",
            rawWikilink: "[[ghost-note]]",
            target: "ghost-note",
            resolutionStrategy: "unresolved",
          },
        ],
      },
    },
  }
}

function makeGraphFixtures() {
  const nodes: GraphNode[] = [
    { id: "a", label: "A", x: 10, y: 20 },
    { id: "b", label: "B", x: 30, y: 40 },
    { id: "c", label: "C", x: 50, y: 60 },
    { id: "d", label: "D", x: 70, y: 80 },
  ]

  const links: GraphLink[] = [
    { sourceNodeId: "a", targetNodeId: "b" },
    { sourceNodeId: "b", targetNodeId: "c" },
  ]

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const adjacency = new Map<string, Set<string>>([
    ["a", new Set(["b"])],
    ["b", new Set(["a", "c"])],
    ["c", new Set(["b"])],
    ["d", new Set()],
  ])

  const context: GraphReducerContext = {
    nodes,
    links,
    nodeById,
    adjacency,
  }

  const initialState: GraphState = {
    selection: { type: "none" },
    hoveredNodeId: null,
    draggedNodeId: null,
    renderModel: deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency,
      selection: { type: "none" },
      hoveredNodeId: null,
      draggedNodeId: null,
    }),
  }

  return {
    nodes,
    links,
    nodeById,
    context,
    initialState,
  }
}

describe("resolveGraphSnapshotSourceFromHtmlConfig", () => {
  test("resolves URL snapshot config", () => {
    const source = resolveGraphSnapshotSourceFromHtmlConfig({
      snapshotUrl: "./graph.json",
      snapshotJson: null,
      baseUrl: "https://example.com/visualizer/index.html",
    })

    expect(source.type).toBe("snapshot-url")
    if (source.type !== "snapshot-url") throw new Error("expected snapshot-url source")
    expect(source.snapshotUrl.href).toBe("https://example.com/visualizer/graph.json")
  })

  test("resolves inline snapshot config", () => {
    const source = resolveGraphSnapshotSourceFromHtmlConfig({
      snapshotUrl: null,
      snapshotJson: JSON.stringify(makeSnapshotPayload()),
      baseUrl: "https://example.com/visualizer/index.html",
    })

    expect(source.type).toBe("snapshot-inline")
    if (source.type !== "snapshot-inline") throw new Error("expected snapshot-inline source")
    expect(source.snapshotPayload).toEqual(makeSnapshotPayload())
  })

  test("throws on ambiguous snapshot config", () => {
    expect(() =>
      resolveGraphSnapshotSourceFromHtmlConfig({
        snapshotUrl: "./graph.json",
        snapshotJson: JSON.stringify(makeSnapshotPayload()),
        baseUrl: "https://example.com/visualizer/index.html",
      }),
    ).toThrow("Ambiguous graph snapshot source")
  })

  test("throws on missing snapshot config", () => {
    expect(() =>
      resolveGraphSnapshotSourceFromHtmlConfig({
        snapshotUrl: null,
        snapshotJson: null,
        baseUrl: "https://example.com/visualizer/index.html",
      }),
    ).toThrow("Missing graph snapshot source in HTML")
  })

  test("throws on invalid inline snapshot JSON", () => {
    expect(() =>
      resolveGraphSnapshotSourceFromHtmlConfig({
        snapshotUrl: null,
        snapshotJson: "{not-valid-json",
        baseUrl: "https://example.com/visualizer/index.html",
      }),
    ).toThrow("Invalid graph snapshot JSON in HTML")
  })
})

describe("resolveInitialSelectedNodeIdFromHtmlConfig", () => {
  test("returns trimmed node id when configured", () => {
    expect(resolveInitialSelectedNodeIdFromHtmlConfig("  beta  ")).toBe("beta")
  })

  test("returns null for missing or blank config", () => {
    expect(resolveInitialSelectedNodeIdFromHtmlConfig(null)).toBeNull()
    expect(resolveInitialSelectedNodeIdFromHtmlConfig(undefined)).toBeNull()
    expect(resolveInitialSelectedNodeIdFromHtmlConfig("   ")).toBeNull()
  })
})

describe("createGraphDataFromSnapshotPayload", () => {
  test("decodes valid snapshot payload and derives graph model", () => {
    const graph = createGraphDataFromSnapshotPayload(makeSnapshotPayload())

    expect(graph.nodes).toEqual([
      { id: "alpha", label: "Alpha Label" },
      { id: "beta", label: "beta" },
    ])
    expect(graph.links).toEqual([{ sourceNodeId: "alpha", targetNodeId: "beta" }])
    expect(graph.nodeById.size).toBe(2)
    expect(graph.snapshotNodeById.get("alpha")).toEqual(makeSnapshotPayload().nodes[0])
    expect([...(graph.adjacency.get("alpha") ?? [])]).toEqual(["beta"])
  })
})

describe("createGraphVisualizerSelectionChange", () => {
  test("builds note payload with navigation-relevant fields", () => {
    const graph = createGraphDataFromSnapshotPayload(makeSnapshotPayload())

    expect(
      createGraphVisualizerSelectionChange({
        selectedNodeId: "alpha",
        snapshotNodeById: graph.snapshotNodeById,
      }),
    ).toEqual({
      type: "note",
      nodeId: "alpha",
      displayLabel: "Alpha Label",
      relativePath: "alpha.md",
      permalink: "/alpha/",
      slug: "alpha",
      routePath: "/vault/alpha",
      title: "Alpha Title",
      aliases: ["alpha-alias"],
      published: true,
    })
  })

  test("builds placeholder payload for unresolved nodes", () => {
    const graph = createGraphDataFromSnapshotPayload(makeSnapshotPayloadWithPlaceholder())

    expect(
      createGraphVisualizerSelectionChange({
        selectedNodeId: "ghost",
        snapshotNodeById: graph.snapshotNodeById,
      }),
    ).toEqual({
      type: "placeholder",
      nodeId: "ghost",
      displayLabel: "ghost-note",
      unresolvedTarget: "ghost-note",
    })
  })

  test("returns none for empty selection", () => {
    const graph = createGraphDataFromSnapshotPayload(makeSnapshotPayload())

    expect(
      createGraphVisualizerSelectionChange({
        selectedNodeId: null,
        snapshotNodeById: graph.snapshotNodeById,
      }),
    ).toEqual({ type: "none" })
  })
})

describe("reduceGraphState", () => {
  test("selection/set selects node then computes neighborhood", () => {
    const { context, initialState } = makeGraphFixtures()

    const next = reduceGraphState(initialState, { type: "selection/set", nodeId: "b" }, context)

    expect(next.selection.type).toBe("selected")
    if (next.selection.type !== "selected") throw new Error("expected selected state")
    expect([...next.selection.unmutedNodeIds].sort()).toEqual(["a", "b", "c"])
    const nodeVisualById = new Map(next.renderModel.nodes.map((node) => [node.id, node.visual]))
    expect(nodeVisualById.get("b")).toBe("selected")
    expect(nodeVisualById.has("d")).toBeFalse()
  })

  test("selection/set on same id keeps selection", () => {
    const { context, initialState } = makeGraphFixtures()
    const selected = reduceGraphState(initialState, { type: "selection/set", nodeId: "b" }, context)

    const reselected = reduceGraphState(selected, { type: "selection/set", nodeId: "b" }, context)

    expect(reselected.selection).toEqual(selected.selection)
    expect(reselected.hoveredNodeId).toBeNull()
    expect(reselected.draggedNodeId).toBeNull()
  })

  test("simulation/tick preserves selected node", () => {
    const { context, initialState } = makeGraphFixtures()
    const selected = reduceGraphState(initialState, { type: "selection/set", nodeId: "a" }, context)

    const ticked = reduceGraphState(selected, { type: "simulation/tick" }, context)

    expect(ticked.selection).toEqual(selected.selection)
  })

  test("selection/set replaces selected node", () => {
    const { context, initialState } = makeGraphFixtures()
    const selected = reduceGraphState(initialState, { type: "selection/set", nodeId: "a" }, context)

    const updated = reduceGraphState(selected, { type: "selection/set", nodeId: "c" }, context)

    expect(updated.selection.type).toBe("selected")
    if (updated.selection.type !== "selected") throw new Error("expected selected state")
    expect(updated.selection.nodeId).toBe("c")
  })

  test("hover/set and hover/clear update hovered node id", () => {
    const { context, initialState } = makeGraphFixtures()

    const hovered = reduceGraphState(initialState, { type: "hover/set", nodeId: "b" }, context)
    const cleared = reduceGraphState(hovered, { type: "hover/clear", nodeId: "b" }, context)

    expect(hovered.hoveredNodeId).toBe("b")
    expect(cleared.hoveredNodeId).toBeNull()
  })

  test("drag/focus actions update dragged node id", () => {
    const { context, initialState } = makeGraphFixtures()

    const focused = reduceGraphState(initialState, { type: "drag/focus/set", nodeId: "b" }, context)
    const cleared = reduceGraphState(focused, { type: "drag/focus/clear", nodeId: "b" }, context)

    expect(focused.draggedNodeId).toBe("b")
    expect(cleared.draggedNodeId).toBeNull()
  })
})

describe("reduceGraphStateWithTransition", () => {
  test("emits selection/changed only when selected node changes", () => {
    const { context, initialState } = makeGraphFixtures()

    const selected = reduceGraphStateWithTransition(
      initialState,
      { type: "selection/set", nodeId: "b" },
      context,
    )
    expect(selected.transition).toEqual({ type: "selection/changed", selectedNodeId: "b" })

    const ticked = reduceGraphStateWithTransition(
      selected.state,
      { type: "simulation/tick" },
      context,
    )
    expect(ticked.transition).toEqual({ type: "none" })
  })
})

describe("reduceGraphStateWithCommands", () => {
  test("emits typed selection/changed command", () => {
    const { context, initialState } = makeGraphFixtures()

    const selected = reduceGraphStateWithCommands(
      initialState,
      { type: "selection/set", nodeId: "b" },
      context,
    )

    expect(selected.commands).toEqual([{ type: "selection/changed", selectedNodeId: "b" }])
  })
})

describe("reduceAppStateWithCommands", () => {
  test("creates initial selected state when host provides selected node id", () => {
    const { context } = makeGraphFixtures()

    const initial = createAppState(context, "c")

    expect(initial.graph.selection.type).toBe("selected")
    if (initial.graph.selection.type !== "selected") throw new Error("expected selected state")
    expect(initial.graph.selection.nodeId).toBe("c")
  })

  test("falls back deterministically when host provides unknown selected node id", () => {
    const { context } = makeGraphFixtures()

    const initial = createAppState(context, "missing")

    expect(initial.graph.selection.type).toBe("selected")
    if (initial.graph.selection.type !== "selected") throw new Error("expected selected state")
    expect(initial.graph.selection.nodeId).toBe("a")
  })

  test("pointer/move while idle is no-op", () => {
    const { context } = makeGraphFixtures()
    const initial = createAppState(context)

    const next = reduceAppStateWithCommands(
      initial,
      { type: "pointer/move", global: { x: 1, y: 2 } },
      context,
    )

    expect(next.state).toBe(initial)
    expect(next.commands).toEqual([])
  })

  test("drag click selects node and emits side-effect commands", () => {
    const { context } = makeGraphFixtures()
    const initial = createAppState(context)

    const down = reduceAppStateWithCommands(
      initial,
      { type: "pointer/node-down", nodeId: "c", global: { x: 10, y: 10 } },
      context,
    )
    const released = reduceAppStateWithCommands(down.state, { type: "pointer/release" }, context)

    expect(down.state.pointer).toEqual({
      type: "dragging-node",
      nodeId: "c",
      startGlobal: { x: 10, y: 10 },
      hasMoved: false,
    })
    expect(down.commands).toEqual([
      { type: "simulation/alpha-target", alphaTarget: 0.3, restart: true },
      {
        type: "drag/set-node-fixed-position",
        nodeId: "c",
        pointerGlobal: { x: 10, y: 10 },
      },
    ])

    expect(released.state.pointer).toEqual({ type: "idle" })
    expect(released.state.pointerGlobal).toBeNull()
    expect(released.commands).toEqual([
      { type: "simulation/alpha-target", alphaTarget: 0, restart: false },
      { type: "drag/release-node-fixed-position", nodeId: "c" },
      { type: "simulation/set-selected-node", nodeId: "c" },
      { type: "simulation/reheat", alpha: 0.28 },
      { type: "selection/notify-host", selectedNodeId: "c" },
      {
        type: "drag/center-released-selected-node",
        releasedNodeId: "c",
        selectedNodeId: "c",
      },
    ])
  })

  test("drag move marks drag as moved and avoids selection command on release", () => {
    const { context } = makeGraphFixtures()
    const initial = createAppState(context)

    const down = reduceAppStateWithCommands(
      initial,
      { type: "pointer/node-down", nodeId: "c", global: { x: 1, y: 2 } },
      context,
    )
    const moved = reduceAppStateWithCommands(
      down.state,
      { type: "pointer/move", global: { x: 20, y: 24 } },
      context,
    )
    const released = reduceAppStateWithCommands(moved.state, { type: "pointer/release" }, context)

    expect(moved.state.pointer).toEqual({
      type: "dragging-node",
      nodeId: "c",
      startGlobal: { x: 1, y: 2 },
      hasMoved: true,
    })
    expect(moved.commands).toEqual([
      {
        type: "drag/set-node-fixed-position",
        nodeId: "c",
        pointerGlobal: { x: 20, y: 24 },
      },
    ])

    expect(released.commands).toEqual([
      { type: "simulation/alpha-target", alphaTarget: 0, restart: false },
      { type: "drag/release-node-fixed-position", nodeId: "c" },
    ])
  })

  test("reselecting same node emits no host notification command", () => {
    const { context } = makeGraphFixtures()
    const initial = createAppState(context, "c")

    const down = reduceAppStateWithCommands(
      initial,
      { type: "pointer/node-down", nodeId: "c", global: { x: 10, y: 10 } },
      context,
    )
    const released = reduceAppStateWithCommands(down.state, { type: "pointer/release" }, context)

    const hostCommands = released.commands.filter(
      (command): command is Extract<AppCommand, { type: "selection/notify-host" }> =>
        command.type === "selection/notify-host",
    )
    expect(hostCommands).toEqual([])
  })

  test("single gesture FSM handles stage pan", () => {
    const { context } = makeGraphFixtures()
    const initial = createAppState(context)

    const down = reduceAppStateWithCommands(
      initial,
      {
        type: "pointer/stage-down",
        global: { x: 10, y: 10 },
        world: { x: 100, y: 200 },
      },
      context,
    )
    const moved = reduceAppStateWithCommands(
      down.state,
      { type: "pointer/move", global: { x: 25, y: 40 } },
      context,
    )

    expect(down.state.pointer).toEqual({
      type: "panning",
      startGlobal: { x: 10, y: 10 },
      startWorld: { x: 100, y: 200 },
    })
    expect(moved.commands).toEqual([
      {
        type: "world/set-position",
        position: { x: 115, y: 230 },
      },
    ])
  })
})

describe("deriveRenderModel", () => {
  test("selected node derives node/edge visuals + labels", () => {
    const { nodes, links, nodeById, context } = makeGraphFixtures()
    const selection: SelectionSnapshot = {
      type: "selected",
      nodeId: "b",
      unmutedNodeIds: new Set(["a", "b", "c"]),
    }

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection,
      hoveredNodeId: null,
      draggedNodeId: null,
    })

    const nodeVisualById = new Map(model.nodes.map((node) => [node.id, node.visual]))
    expect(nodeVisualById.get("a")).toBe("default")
    expect(nodeVisualById.get("b")).toBe("selected")
    expect(nodeVisualById.has("d")).toBeFalse()

    expect(model.edges).toEqual([
      {
        source: { x: 10, y: 20 },
        target: { x: 30, y: 40 },
        visual: "muted",
      },
      {
        source: { x: 30, y: 40 },
        target: { x: 50, y: 60 },
        visual: "muted",
      },
    ])

    expect(model.labels).toEqual([
      {
        id: "a",
        text: "A",
        x: 10,
        y: 20,
        state: "default",
        scaleState: "default",
        isHovered: false,
      },
      {
        id: "b",
        text: "B",
        x: 30,
        y: 40,
        state: "selected",
        scaleState: "selected",
        isHovered: false,
      },
      {
        id: "c",
        text: "C",
        x: 50,
        y: 60,
        state: "default",
        scaleState: "default",
        isHovered: false,
      },
    ])
  })

  test("skips edges whose endpoint lacks position", () => {
    const { nodes, nodeById, context } = makeGraphFixtures()
    const links: GraphLink[] = [{ sourceNodeId: "a", targetNodeId: "missing" }]
    const selection: SelectionSnapshot = { type: "none" }

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection,
      hoveredNodeId: null,
      draggedNodeId: null,
    })

    expect(model.edges).toEqual([])
  })

  test("hovered node unmutes only connected edges", () => {
    const { nodes, links, nodeById, context } = makeGraphFixtures()
    const selection: SelectionSnapshot = {
      type: "selected",
      nodeId: "b",
      unmutedNodeIds: new Set(["a", "b", "c"]),
    }

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection,
      hoveredNodeId: "a",
      draggedNodeId: null,
    })

    expect(model.edges).toEqual([
      {
        source: { x: 10, y: 20 },
        target: { x: 30, y: 40 },
        visual: "default",
      },
      {
        source: { x: 30, y: 40 },
        target: { x: 50, y: 60 },
        visual: "muted",
      },
    ])
  })

  test("hovered node mutes a selected node outside the hover neighborhood", () => {
    const { nodes, links, nodeById, context } = makeGraphFixtures()
    const selection: SelectionSnapshot = {
      type: "selected",
      nodeId: "c",
      unmutedNodeIds: new Set(["a", "b", "c"]),
    }

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection,
      hoveredNodeId: "a",
      draggedNodeId: null,
    })

    const nodeByIdFromModel = new Map(model.nodes.map((node) => [node.id, node]))
    expect(nodeByIdFromModel.get("a")?.visual).toBe("default")
    expect(nodeByIdFromModel.get("b")?.visual).toBe("default")
    expect(nodeByIdFromModel.get("c")?.visual).toBe("muted")
    expect(nodeByIdFromModel.get("c")?.scaleState).toBe("selected")
  })

  test("hovered node mutes labels beyond depth one", () => {
    const { nodes, links, nodeById, context } = makeGraphFixtures()

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection: { type: "none" },
      hoveredNodeId: "a",
      draggedNodeId: null,
    })

    const labelStateById = new Map(model.labels.map((label) => [label.id, label.state]))
    expect(labelStateById.get("a")).toBe("default")
    expect(labelStateById.get("b")).toBe("default")
    expect(labelStateById.get("c")).toBe("muted")
    expect(labelStateById.get("d")).toBe("muted")
  })

  test("dragged node applies hover-like muting but disables dragged label hover animation", () => {
    const { nodes, links, nodeById, context } = makeGraphFixtures()

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection: { type: "none" },
      hoveredNodeId: null,
      draggedNodeId: "a",
    })

    expect(model.edges).toEqual([
      {
        source: { x: 10, y: 20 },
        target: { x: 30, y: 40 },
        visual: "default",
      },
      {
        source: { x: 30, y: 40 },
        target: { x: 50, y: 60 },
        visual: "muted",
      },
    ])

    const labelById = new Map(model.labels.map((label) => [label.id, label]))
    expect(labelById.get("a")?.state).toBe("default")
    expect(labelById.get("a")?.isHovered).toBeFalse()
    expect(labelById.get("b")?.state).toBe("default")
    expect(labelById.get("c")?.state).toBe("muted")
    expect(labelById.get("d")?.state).toBe("muted")
  })
})

describe("centerReleasedSelectedNode", () => {
  test("nudges selected node toward center when drag ends", () => {
    const { nodeById } = makeGraphFixtures()
    const didCenter = centerReleasedSelectedNode({
      releasedNodeId: "a",
      selectedNodeId: "a",
      nodeById,
      world: { toLocal: (point) => ({ x: point.x + 10, y: point.y + 20 }) },
      getCanvasCenterGlobal: () => ({ x: 100, y: 50 }),
    })

    const node = nodeById.get("a")
    expect(didCenter).toBeTrue()
    expect(node?.x).toBe(10)
    expect(node?.y).toBe(20)
    expect(node?.vx ?? 0).toBeGreaterThan(0)
    expect(node?.vy ?? 0).toBeGreaterThan(0)
    expect(node?.fx).toBeNull()
    expect(node?.fy).toBeNull()
  })

  test("does not center when released node is not selected", () => {
    const { nodeById } = makeGraphFixtures()
    const didCenter = centerReleasedSelectedNode({
      releasedNodeId: "a",
      selectedNodeId: "b",
      nodeById,
      world: { toLocal: (point) => point },
      getCanvasCenterGlobal: () => ({ x: 100, y: 50 }),
    })

    expect(didCenter).toBeFalse()
    expect(nodeById.get("a")?.fx).toBeUndefined()
    expect(nodeById.get("a")?.fy).toBeUndefined()
  })

  test("does not push non-selected nodes directly; handled by simulation forces", () => {
    const selected: GraphNode = { id: "a", label: "A", x: 0, y: 0 }
    const nearbyOne: GraphNode = { id: "b", label: "B", x: 10, y: 0 }
    const nearbyTwo: GraphNode = { id: "c", label: "C", x: 0, y: 10 }
    const farAway: GraphNode = { id: "d", label: "D", x: 300, y: 0 }
    const nodeById = new Map<string, GraphNode>([
      ["a", selected],
      ["b", nearbyOne],
      ["c", nearbyTwo],
      ["d", farAway],
    ])

    const didCenter = centerReleasedSelectedNode({
      releasedNodeId: "a",
      selectedNodeId: "a",
      nodeById,
      world: { toLocal: (point) => point },
      getCanvasCenterGlobal: () => ({ x: 0, y: 0 }),
    })

    expect(didCenter).toBeTrue()
    expect(nearbyOne.vx).toBeUndefined()
    expect(nearbyOne.vy).toBeUndefined()
    expect(nearbyTwo.vx).toBeUndefined()
    expect(nearbyTwo.vy).toBeUndefined()
    expect(farAway.vx).toBeUndefined()
    expect(farAway.vy).toBeUndefined()
  })
})

describe("scaleWorldAroundAnchor", () => {
  test("preserves the viewport center while zooming", () => {
    expect(
      scaleWorldAroundAnchor({
        worldX: 0,
        worldY: 0,
        currentScale: 1,
        nextScale: 2,
        anchor: { x: 450, y: 350 },
      }),
    ).toEqual({ x: -450, y: -350 })
  })

  test("returns the original position when the scale does not change", () => {
    expect(
      scaleWorldAroundAnchor({
        worldX: 120,
        worldY: -40,
        currentScale: 1.5,
        nextScale: 1.5,
        anchor: { x: 450, y: 350 },
      }),
    ).toEqual({ x: 120, y: -40 })
  })
})

describe("createSimulation", () => {
  test("centers nodes within the provided viewport instead of the window", () => {
    const nodes: GraphNode[] = [{ id: "alpha", label: "Alpha" }]
    const simulationController = createSimulation({
      nodes,
      links: [],
      nodeById: new Map(nodes.map((node) => [node.id, node])),
      adjacency: new Map([["alpha", new Set<string>()]]),
      initialViewportSize: { width: 446, height: 722 },
    })

    simulationController.simulation.stop()
    simulationController.simulation.tick(300)

    expect(nodes[0]?.x).toBeCloseTo(223, 0)
    expect(nodes[0]?.y).toBeCloseTo(361, 0)

    simulationController.dispose()
  })

  test("updates the simulation center when the viewport changes", () => {
    const nodes: GraphNode[] = [{ id: "alpha", label: "Alpha" }]
    const simulationController = createSimulation({
      nodes,
      links: [],
      nodeById: new Map(nodes.map((node) => [node.id, node])),
      adjacency: new Map([["alpha", new Set<string>()]]),
      initialViewportSize: { width: 446, height: 722 },
    })

    simulationController.simulation.stop()
    simulationController.setLayoutCenter(toViewportCenter({ width: 900, height: 400 }))
    simulationController.simulation.alpha(1)
    simulationController.simulation.tick(300)

    expect(nodes[0]?.x).toBeCloseTo(450, 0)
    expect(nodes[0]?.y).toBeCloseTo(200, 0)

    simulationController.dispose()
  })
})
