export {
  bootstrapGraphVisualizer,
  createGraphVisualizerSelectionChange,
  resolveInitialSelectedNodeIdFromHtmlConfig,
  resolveGraphSnapshotSourceFromHtmlConfig,
  type GraphVisualizerBootstrapOptions,
  type GraphVisualizerNoSelectionChange,
  type GraphVisualizerNoteSelectionChange,
  type GraphVisualizerPlaceholderSelectionChange,
  type GraphVisualizerSelectionChange,
  type HtmlGraphSnapshotSource,
} from "./bootstrap"
export { createAppState, reduceAppStateWithCommands } from "./app-state"
export { centerReleasedSelectedNode } from "./simulation"
export {
  createGraphDataFromSnapshotPayload,
  createGraphDataFromSnapshot,
  createGraphState,
  decodeGraphSnapshot,
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
