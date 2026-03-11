# `@urban/graph-visualizer-2`

Browser-first graph visualizer for `@urban/build-graph` snapshots.

## Selection callback

`bootstrapGraphVisualizer` accepts optional `onSelectionChange` for real post-bootstrap selection changes.

```ts
import { bootstrapGraphVisualizer } from "@urban/graph-visualizer-2/src/main"

await bootstrapGraphVisualizer({
  selectedNodeId: currentNodeId,
  onSelectionChange: (selection) => {
    if (selection.type !== "note") return
    if (selection.routePath === undefined) return
    window.location.assign(selection.routePath)
  },
})
```

Semantics:

- fires only after an actual selection transition
- does not fire for initial bootstrap `selectedNodeId`
- emits `note`, `placeholder`, or `none`
- keeps browser auto-bootstrap unchanged when callback omitted
