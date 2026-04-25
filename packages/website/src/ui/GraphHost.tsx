import type { GraphSnapshot } from "@urban/build-graph/schema"
import { GraphBoot } from "./GraphBoot"
import { GRAPH_THEME_SET } from "./graphTheme"

const GRAPH_SNAPSHOT_SCRIPT_ID = "graph-snapshot"

const serializeInlineSnapshot = (snapshot: GraphSnapshot): string =>
  JSON.stringify(snapshot).replaceAll("<", "\\u003c")

type Props = {
  snapshot: GraphSnapshot
  selectedNodeId: string
  scrollZoomEnabled?: boolean
}

export const GraphHost = ({ snapshot, selectedNodeId, scrollZoomEnabled = true }: Props) => (
  <>
    {/*<div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-semibold text-black dark:text-white">Graph</h2>
      <p className="text-sm text-black/60 dark:text-white/60">Selection only for now</p>
    </div>*/}
    <section
      id="app"
      data-graph-snapshot-script-id={GRAPH_SNAPSHOT_SCRIPT_ID}
      data-selected-node-id={selectedNodeId}
      className="min-h-105 overflow-hidden rounded-md border border-black/10 dark:border-white/10 bg-stone-50 dark:bg-stone-950"
    />
    <script
      id={GRAPH_SNAPSHOT_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializeInlineSnapshot(snapshot) }}
    />
    <GraphBoot themeSet={GRAPH_THEME_SET} scrollZoomEnabled={scrollZoomEnabled} />
  </>
)
