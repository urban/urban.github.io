import { createGraphState, reduceGraphStateWithCommands } from "./state"
import {
  GRAPH_CONFIG,
  movedBeyondSelectionDistance,
  selectedNodeIdFromSelection,
  type AppAction,
  type AppCommand,
  type AppState,
  type GraphAction,
  type GraphReducerContext,
  type NodeId,
  type Point,
} from "./shared"

function toSelectionCommands(
  graphCommands: ReturnType<typeof reduceGraphStateWithCommands>["commands"],
): AppCommand[] {
  const commands: AppCommand[] = []
  for (const command of graphCommands) {
    if (command.type !== "selection/changed") continue
    commands.push({ type: "simulation/set-selected-node", nodeId: command.selectedNodeId })
    commands.push({
      type: "simulation/reheat",
      alpha: GRAPH_CONFIG.physics.selectedCenterReheatAlpha,
    })
  }
  return commands
}

function reduceGraphActions(
  appState: AppState,
  graphActions: ReadonlyArray<GraphAction>,
  context: GraphReducerContext,
): { state: AppState; commands: AppCommand[] } {
  if (graphActions.length === 0) {
    return { state: appState, commands: [] }
  }

  let nextGraphState = appState.graph
  const commands: AppCommand[] = []
  for (const action of graphActions) {
    const reduced = reduceGraphStateWithCommands(nextGraphState, action, context)
    nextGraphState = reduced.state
    if (action.type === "simulation/tick") {
      commands.push({ type: "simulation/sync-selected-layout-center" })
    }
    commands.push(...toSelectionCommands(reduced.commands))
  }

  return {
    state: nextGraphState === appState.graph ? appState : { ...appState, graph: nextGraphState },
    commands,
  }
}

function pointerMoveDuringPan(
  state: AppState,
  global: Point,
): { state: AppState; commands: AppCommand[] } {
  if (state.pointer.type !== "panning") {
    return { state, commands: [] }
  }

  const nextPosition = {
    x: state.pointer.startWorld.x + (global.x - state.pointer.startGlobal.x),
    y: state.pointer.startWorld.y + (global.y - state.pointer.startGlobal.y),
  }

  return {
    state: state.pointerGlobal === global ? state : { ...state, pointerGlobal: global },
    commands: [{ type: "world/set-position", position: nextPosition }],
  }
}

function pointerMoveDuringDrag(
  state: AppState,
  global: Point,
): { state: AppState; commands: AppCommand[] } {
  if (state.pointer.type !== "dragging-node") {
    return { state, commands: [] }
  }

  const hasMoved =
    state.pointer.hasMoved || movedBeyondSelectionDistance(state.pointer.startGlobal, global)
  const nextPointer =
    hasMoved === state.pointer.hasMoved ? state.pointer : { ...state.pointer, hasMoved }

  return {
    state: {
      ...state,
      pointer: nextPointer,
      pointerGlobal: global,
    },
    commands: [
      {
        type: "drag/set-node-fixed-position",
        nodeId: state.pointer.nodeId,
        pointerGlobal: global,
      },
    ],
  }
}

function reduceRelease(
  state: AppState,
  context: GraphReducerContext,
): { state: AppState; commands: AppCommand[] } {
  if (state.pointer.type !== "dragging-node") {
    if (state.pointer.type === "idle" && state.pointerGlobal === null) {
      return { state, commands: [] }
    }
    return {
      state: {
        ...state,
        pointer: { type: "idle" },
        pointerGlobal: null,
      },
      commands: [],
    }
  }

  const releasedNodeId = state.pointer.nodeId
  const releaseGraphActions: GraphAction[] = [
    { type: "drag/focus/clear", nodeId: releasedNodeId },
    { type: "hover/clear", nodeId: releasedNodeId },
  ]
  if (!state.pointer.hasMoved) {
    releaseGraphActions.push({ type: "selection/set", nodeId: releasedNodeId })
  }

  const reducedGraph = reduceGraphActions(state, releaseGraphActions, context)
  const selectedNodeId = selectedNodeIdFromSelection(reducedGraph.state.graph.selection)

  const commands: AppCommand[] = [
    {
      type: "simulation/alpha-target",
      alphaTarget: GRAPH_CONFIG.physics.idleAlphaTarget,
      restart: false,
    },
    { type: "drag/release-node-fixed-position", nodeId: releasedNodeId },
    ...reducedGraph.commands,
  ]

  if (selectedNodeId === releasedNodeId) {
    commands.push({
      type: "drag/center-released-selected-node",
      releasedNodeId,
      selectedNodeId,
    })
  }

  return {
    state: {
      ...reducedGraph.state,
      pointer: { type: "idle" },
      pointerGlobal: null,
    },
    commands,
  }
}

export function createAppState(
  context: GraphReducerContext,
  initialSelectedNodeId: NodeId | null = null,
): AppState {
  return {
    graph: createGraphState(initialSelectedNodeId, null, null, context),
    pointer: { type: "idle" },
    pointerGlobal: null,
  }
}

export function reduceAppStateWithCommands(
  state: AppState,
  action: AppAction,
  context: GraphReducerContext,
): { state: AppState; commands: ReadonlyArray<AppCommand> } {
  switch (action.type) {
    case "graph/action":
      return reduceGraphActions(state, [action.action], context)
    case "pointer/stage-down":
      return {
        state: {
          ...state,
          pointer: {
            type: "panning",
            startGlobal: action.global,
            startWorld: action.world,
          },
          pointerGlobal: action.global,
        },
        commands: [],
      }
    case "pointer/node-down": {
      const reduced = reduceGraphActions(
        state,
        [
          { type: "hover/clear", nodeId: action.nodeId },
          { type: "drag/focus/set", nodeId: action.nodeId },
        ],
        context,
      )

      return {
        state: {
          ...reduced.state,
          pointer: {
            type: "dragging-node",
            nodeId: action.nodeId,
            startGlobal: action.global,
            hasMoved: false,
          },
          pointerGlobal: action.global,
        },
        commands: [
          {
            type: "simulation/alpha-target",
            alphaTarget: GRAPH_CONFIG.physics.dragAlphaTarget,
            restart: true,
          },
          {
            type: "drag/set-node-fixed-position",
            nodeId: action.nodeId,
            pointerGlobal: action.global,
          },
          ...reduced.commands,
        ],
      }
    }
    case "pointer/node-over": {
      if (state.pointer.type !== "idle") {
        return { state, commands: [] }
      }
      return reduceGraphActions(state, [{ type: "hover/set", nodeId: action.nodeId }], context)
    }
    case "pointer/node-out":
      return reduceGraphActions(state, [{ type: "hover/clear", nodeId: action.nodeId }], context)
    case "pointer/move": {
      if (state.pointer.type === "dragging-node") {
        return pointerMoveDuringDrag(state, action.global)
      }
      if (state.pointer.type === "panning") {
        return pointerMoveDuringPan(state, action.global)
      }
      return { state, commands: [] }
    }
    case "pointer/release":
      return reduceRelease(state, context)
  }
}
