import type { GraphSnapshot } from "@urban/build-graph/schema"
import { VaultGraphBoot } from "./VaultGraphBoot"
import {
  DARK_VAULT_GRAPH_THEME,
  LIGHT_VAULT_GRAPH_THEME,
  serializeGraphTheme,
} from "./vaultGraphTheme"

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
      data-light-graph-theme={serializeGraphTheme(LIGHT_VAULT_GRAPH_THEME)}
      data-dark-graph-theme={serializeGraphTheme(DARK_VAULT_GRAPH_THEME)}
      className="min-h-[420px] overflow-hidden rounded-md border border-black/10 bg-stone-50 dark:border-white/10 dark:bg-stone-950"
    />
    <script
      id={GRAPH_SNAPSHOT_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializeInlineSnapshot(snapshot) }}
    />
    <VaultGraphBoot />
  </>
)
