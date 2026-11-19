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
    <section
      id="app"
      data-graph-snapshot-script-id={GRAPH_SNAPSHOT_SCRIPT_ID}
      data-selected-node-id={selectedNodeId}
      className="note-graph"
      aria-label="Interactive garden knowledge graph"
    />
    <script
      id={GRAPH_SNAPSHOT_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializeInlineSnapshot(snapshot) }}
    />
    <GraphBoot themeSet={GRAPH_THEME_SET} scrollZoomEnabled={scrollZoomEnabled} />
  </>
)
