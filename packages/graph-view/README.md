# `@urban/graph-view`

Browser-first graph visualizer for `@urban/build-graph` snapshots.

## Selection callback

`bootstrapGraphVisualizer` accepts optional `onSelectionChange` for real post-bootstrap selection changes.

```ts
import { bootstrapGraphVisualizer } from "@urban/graph-view/src/main"

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

## HTML theme overrides

The default light and dark graph themes can be overridden from `#app` with JSON-encoded
`data-light-graph-theme` and `data-dark-graph-theme` attributes.

```html
<div
  id="app"
  data-graph-snapshot-url="/graph-snapshot.json"
  data-light-graph-theme='{"view":{"backgroundColor":16119285},"node":{"variants":{"default":{"fill":7893356,"stroke":16119284,"strokeWidth":1,"alpha":1},"selected":{"fill":789335,"stroke":16119284,"strokeWidth":2,"alpha":1},"muted":{"fill":14079761,"stroke":16119284,"strokeWidth":1,"alpha":0.45}},"scales":{"default":1,"selected":2,"muted":1}},"edge":{"variants":{"default":{"width":2,"color":5722958,"alpha":0.55},"muted":{"width":2,"color":11051678,"alpha":0.18}}},"label":{"variants":{"default":{"fill":789335,"alpha":1},"selected":{"fill":789335,"alpha":1},"muted":{"fill":7893356,"alpha":0.45}},"style":{"fontFamily":"Arial","fontSize":16,"fontWeight":"400"}}}'
  data-dark-graph-theme='{"view":{"backgroundColor":1777943},"node":{"variants":{"default":{"fill":11051678,"stroke":789335,"strokeWidth":1,"alpha":1},"selected":{"fill":16119284,"stroke":789335,"strokeWidth":2,"alpha":1},"muted":{"fill":4473924,"stroke":789335,"strokeWidth":1,"alpha":0.45}},"scales":{"default":1,"selected":2,"muted":1}},"edge":{"variants":{"default":{"width":2,"color":14079761,"alpha":0.5},"muted":{"width":2,"color":5722958,"alpha":0.25}}},"label":{"variants":{"default":{"fill":16119284,"alpha":1},"selected":{"fill":16119284,"alpha":1},"muted":{"fill":11051678,"alpha":0.45}},"style":{"fontFamily":"Arial","fontSize":16,"fontWeight":"400"}}}'
></div>
```
