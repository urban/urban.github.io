import type { GraphSnapshot } from "@urban/build-graph/schema"
import { VaultGraphBoot } from "./VaultGraphBoot"

const GRAPH_SNAPSHOT_SCRIPT_ID = "graph-snapshot"

const serializeInlineSnapshot = (snapshot: GraphSnapshot): string =>
  JSON.stringify(snapshot).replaceAll("<", "\\u003c")

type Props = {
  snapshot: GraphSnapshot
  selectedNodeId: string
}

export const VaultGraphHost = ({ snapshot, selectedNodeId }: Props) => (
  <>
    {/*<div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-semibold text-black dark:text-white">Graph</h2>
      <p className="text-sm text-black/60 dark:text-white/60">Selection only for now</p>
    </div>*/}
    <section
      id="app"
      data-graph-snapshot-script-id={GRAPH_SNAPSHOT_SCRIPT_ID}
      data-selected-node-id={selectedNodeId}
      className="min-h-[420px] overflow-hidden rounded-md border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04]"
    />
    <script
      id={GRAPH_SNAPSHOT_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializeInlineSnapshot(snapshot) }}
    />
    <VaultGraphBoot />
  </>
)
