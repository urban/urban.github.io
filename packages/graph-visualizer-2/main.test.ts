import { describe, expect, test } from "bun:test"
import {
  centerSelectedReleasedNode,
  deriveRenderModel,
  reduceGraphState,
  reduceSpriteInteractionState,
  type GraphLink,
  type GraphNode,
  type GraphReducerContext,
  type GraphState,
  type SelectionSnapshot,
  type SpriteInteractionState,
} from "./main"

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
    renderModel: deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency,
      selection: { type: "none" },
      hoveredNodeId: null,
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

describe("reduceGraphState", () => {
  test("selection/toggle selects node then computes neighborhood", () => {
    const { context, initialState } = makeGraphFixtures()

    const next = reduceGraphState(initialState, { type: "selection/toggle", nodeId: "b" }, context)

    expect(next.selection.type).toBe("selected")
    if (next.selection.type !== "selected") throw new Error("expected selected state")
    expect([...next.selection.unmutedNodeIds].sort()).toEqual(["a", "b", "c"])
    const nodeVisualById = new Map(next.renderModel.nodes.map((node) => [node.id, node.visual]))
    expect(nodeVisualById.get("b")).toBe("selected")
    expect(nodeVisualById.has("d")).toBeFalse()
  })

  test("selection/toggle on same id keeps selection", () => {
    const { context, initialState } = makeGraphFixtures()
    const selected = reduceGraphState(
      initialState,
      { type: "selection/toggle", nodeId: "b" },
      context,
    )

    const reselected = reduceGraphState(
      selected,
      { type: "selection/toggle", nodeId: "b" },
      context,
    )

    expect(reselected.selection).toEqual(selected.selection)
    expect(reselected.hoveredNodeId).toBeNull()
  })

  test("simulation/tick preserves selected node", () => {
    const { context, initialState } = makeGraphFixtures()
    const selected = reduceGraphState(initialState, { type: "selection/set", nodeId: "a" }, context)

    const ticked = reduceGraphState(selected, { type: "simulation/tick" }, context)

    expect(ticked.selection).toEqual(selected.selection)
  })

  test("selection/clear does not change selection", () => {
    const { context, initialState } = makeGraphFixtures()
    const selected = reduceGraphState(initialState, { type: "selection/set", nodeId: "a" }, context)

    const cleared = reduceGraphState(selected, { type: "selection/clear" }, context)

    expect(cleared.selection).toEqual(selected.selection)
    expect(cleared.hoveredNodeId).toEqual(selected.hoveredNodeId)
  })

  test("hover/set and hover/clear update hovered node id", () => {
    const { context, initialState } = makeGraphFixtures()

    const hovered = reduceGraphState(initialState, { type: "hover/set", nodeId: "b" }, context)
    const cleared = reduceGraphState(hovered, { type: "hover/clear", nodeId: "b" }, context)

    expect(hovered.hoveredNodeId).toBe("b")
    expect(cleared.hoveredNodeId).toBeNull()
  })
})

describe("reduceSpriteInteractionState", () => {
  const initialInteractionState: SpriteInteractionState = {
    drag: { type: "idle" },
    pointerGlobal: null,
    selectionRequestNodeId: null,
    selectionRequestId: 0,
  }

  test("drag/move while idle no-op", () => {
    const next = reduceSpriteInteractionState(initialInteractionState, {
      type: "drag/move",
      global: { x: 1, y: 2 },
    })

    expect(next).toBe(initialInteractionState)
  })

  test("drag lifecycle updates pointer + resets on end", () => {
    const started = reduceSpriteInteractionState(initialInteractionState, {
      type: "drag/start",
      nodeId: "a",
      global: { x: 1, y: 2 },
    })
    const moved = reduceSpriteInteractionState(started, {
      type: "drag/move",
      global: { x: 4, y: 5 },
    })
    const ended = reduceSpriteInteractionState(moved, { type: "drag/end" })

    expect(started.drag).toEqual({
      type: "dragging",
      nodeId: "a",
      startGlobal: { x: 1, y: 2 },
      hasMoved: false,
    })
    expect(moved.pointerGlobal).toEqual({ x: 4, y: 5 })
    expect(ended).toEqual({
      drag: { type: "idle" },
      pointerGlobal: null,
      selectionRequestNodeId: "a",
      selectionRequestId: 1,
    })
  })

  test("drag end after movement does not request selection", () => {
    const started = reduceSpriteInteractionState(initialInteractionState, {
      type: "drag/start",
      nodeId: "c",
      global: { x: 1, y: 2 },
    })
    const moved = reduceSpriteInteractionState(started, {
      type: "drag/move",
      global: { x: 20, y: 24 },
    })
    const ended = reduceSpriteInteractionState(moved, { type: "drag/end" })

    expect(ended.selectionRequestNodeId).toBeNull()
    expect(ended.selectionRequestId).toBe(0)
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
      { id: "a", text: "A", x: 10, y: 32, state: "default", isHovered: false },
      { id: "b", text: "B", x: 30, y: 58, state: "selected", isHovered: false },
      { id: "c", text: "C", x: 50, y: 72, state: "default", isHovered: false },
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

  test("hovered node mutes labels beyond depth one", () => {
    const { nodes, links, nodeById, context } = makeGraphFixtures()

    const model = deriveRenderModel({
      nodes,
      links,
      nodeById,
      adjacency: context.adjacency,
      selection: { type: "none" },
      hoveredNodeId: "a",
    })

    const labelStateById = new Map(model.labels.map((label) => [label.id, label.state]))
    expect(labelStateById.get("a")).toBe("default")
    expect(labelStateById.get("b")).toBe("default")
    expect(labelStateById.get("c")).toBe("muted")
    expect(labelStateById.get("d")).toBe("muted")
  })
})

describe("centerSelectedReleasedNode", () => {
  const makeState = (drag: SpriteInteractionState["drag"]): SpriteInteractionState => ({
    drag,
    pointerGlobal: null,
    selectionRequestNodeId: null,
    selectionRequestId: 0,
  })

  test("nudges selected node toward center when drag ends", () => {
    const { nodeById } = makeGraphFixtures()
    const didCenter = centerSelectedReleasedNode({
      previousState: makeState({
        type: "dragging",
        nodeId: "a",
        startGlobal: { x: 0, y: 0 },
        hasMoved: true,
      }),
      state: makeState({ type: "idle" }),
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
    const didCenter = centerSelectedReleasedNode({
      previousState: makeState({
        type: "dragging",
        nodeId: "a",
        startGlobal: { x: 0, y: 0 },
        hasMoved: true,
      }),
      state: makeState({ type: "idle" }),
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

    const didCenter = centerSelectedReleasedNode({
      previousState: makeState({
        type: "dragging",
        nodeId: "a",
        startGlobal: { x: 0, y: 0 },
        hasMoved: true,
      }),
      state: makeState({ type: "idle" }),
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
