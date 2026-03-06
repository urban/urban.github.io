export { bootstrapGraphVisualizer } from "./bootstrap"
export { createAppState, reduceAppStateWithCommands } from "./app-state"
export { centerReleasedSelectedNode } from "./simulation"
export {
  createGraphDataFromSnapshot,
  createGraphState,
  deriveRenderModel,
  loadGraphDataFromSnapshot,
  reduceGraphState,
  reduceGraphStateWithCommands,
  reduceGraphStateWithTransition,
} from "./state"
export type {
  AppAction,
  AppState,
  AppCommand,
  GraphAction,
  GraphLink,
  GraphNode,
  GraphReducerContext,
  GraphState,
  SelectionSnapshot,
  PointerGestureState,
} from "./shared"

const isBrowserRuntime = typeof window !== "undefined" && typeof document !== "undefined"

if (isBrowserRuntime) {
  import("./bootstrap")
    .then(async ({ bootstrapGraphVisualizer }) => {
      const dispose = await bootstrapGraphVisualizer()
      if (typeof dispose === "function") {
        window.addEventListener(
          "beforeunload",
          () => {
            dispose()
          },
          { once: true },
        )
      }
    })
    .catch((error: unknown) => {
      console.error(error)
    })
}
