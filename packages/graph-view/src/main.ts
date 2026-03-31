import { Effect } from "effect"

export {
  bootstrapGraphVisualizer,
  bootstrapGraphVisualizerEffect,
  createGraphVisualizerSelectionChange,
  renderGraphVisualizerBootstrapError,
  resolveInitialSelectedNodeIdFromHtmlConfig,
  resolveScrollZoomEnabledFromHtmlConfig,
  resolveGraphSnapshotSourceFromHtmlConfig,
  resolveGraphThemeSetFromHtmlConfig,
  resolveGraphThemeSetFromHtmlConfigEffect,
  toGraphVisualizerBootstrapUserMessage,
  type GraphVisualizerBootstrapOptions,
  type GraphVisualizerBootstrapFailure,
  type GraphVisualizerHandle,
  type GraphVisualizerNoSelectionChange,
  type GraphVisualizerStaticLayoutEntry,
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
export {
  GraphThemeDecodeError,
  GraphThemeJsonParseError,
  GraphVisualizerBootstrapError,
} from "./bootstrap"
export { DARK_GRAPH_THEME, LIGHT_GRAPH_THEME, resolveGraphTheme } from "./shared"
export type {
  AppAction,
  AppState,
  AppCommand,
  GraphAction,
  GraphLink,
  GraphNode,
  GraphReducerContext,
  GraphState,
  GraphTheme,
  GraphThemeSet,
  SelectionSnapshot,
  PointerGestureState,
} from "./shared"

const isBrowserRuntime = typeof window !== "undefined" && typeof document !== "undefined"

if (isBrowserRuntime) {
  import("./bootstrap")
    .then(
      async ({
        GraphThemeDecodeError,
        GraphThemeJsonParseError,
        GraphVisualizerBootstrapError,
        bootstrapGraphVisualizerEffect,
        renderGraphVisualizerBootstrapError,
        toGraphVisualizerBootstrapUserMessage,
      }) => {
        try {
          const dispose = await Effect.runPromise(bootstrapGraphVisualizerEffect())
          if (typeof dispose === "function") {
            window.addEventListener(
              "beforeunload",
              () => {
                dispose()
              },
              { once: true },
            )
          }
        } catch (error: unknown) {
          if (
            error instanceof GraphThemeJsonParseError ||
            error instanceof GraphThemeDecodeError ||
            error instanceof GraphVisualizerBootstrapError
          ) {
            renderGraphVisualizerBootstrapError({
              documentObject: document,
              error,
            })
            console.error(toGraphVisualizerBootstrapUserMessage(error))
            return
          }

          console.error(error)
        }
      },
    )
    .catch((error: unknown) => {
      console.error(error)
    })
}
