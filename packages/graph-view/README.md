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

## Zoom controls

`bootstrapGraphVisualizer` accepts `scrollZoomEnabled` to enable or disable wheel-based zooming.
The `onReady` handle also exposes `getZoomScale`, `setZoomScale`, `setScrollZoomEnabled`, `zoomIn`, and `zoomOut` for external UI.

```ts
import { bootstrapGraphVisualizer } from "@urban/graph-view"

await bootstrapGraphVisualizer({
  scrollZoomEnabled: false,
  onReady: (graphHandle) => {
    document.getElementById("zoom-in")?.addEventListener("click", () => {
      graphHandle.zoomIn()
    })
    document.getElementById("zoom-out")?.addEventListener("click", () => {
      graphHandle.zoomOut()
    })
  },
})
```

When using HTML auto-bootstrap, `#app[data-scroll-zoom-enabled="false"]` disables wheel zoom by default.

## JS theme overrides

`bootstrapGraphVisualizer` can accept a typed `themeSet` directly, which avoids serializing
and parsing theme JSON through the DOM.

```ts
import type { GraphThemeSet } from "@urban/graph-view"
import { bootstrapGraphVisualizer } from "@urban/graph-view"

const themeSet: GraphThemeSet = {
  light: {
    view: { backgroundColor: 0xfafaf9 },
    node: {
      variants: {
        default: { fill: 0x57534e, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 1 },
        selected: { fill: 0xea580c, stroke: 0xffedd5, strokeWidth: 2, alpha: 1 },
        muted: { fill: 0xd6d3d1, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 0.4 },
      },
      scales: { default: 1, selected: 2, muted: 1 },
    },
    edge: {
      variants: {
        default: { width: 2, color: 0x78716c, alpha: 0.42 },
        muted: { width: 2, color: 0xd6d3d1, alpha: 0.18 },
      },
    },
    label: {
      variants: {
        default: { fill: 0x1c1917, alpha: 1 },
        selected: { fill: 0x9a3412, alpha: 1 },
        muted: { fill: 0x78716c, alpha: 0.45 },
      },
      style: { fontFamily: "Arial", fontSize: 16, fontWeight: "400" },
    },
  },
  dark: {
    view: { backgroundColor: 0x0c0a09 },
    node: {
      variants: {
        default: { fill: 0xd6d3d1, stroke: 0x1c1917, strokeWidth: 1, alpha: 1 },
        selected: { fill: 0xfb923c, stroke: 0x7c2d12, strokeWidth: 2, alpha: 1 },
        muted: { fill: 0x44403c, stroke: 0x1c1917, strokeWidth: 1, alpha: 0.4 },
      },
      scales: { default: 1, selected: 2, muted: 1 },
    },
    edge: {
      variants: {
        default: { width: 2, color: 0xa8a29e, alpha: 0.38 },
        muted: { width: 2, color: 0x57534e, alpha: 0.22 },
      },
    },
    label: {
      variants: {
        default: { fill: 0xf5f5f4, alpha: 1 },
        selected: { fill: 0xfdba74, alpha: 1 },
        muted: { fill: 0xa8a29e, alpha: 0.45 },
      },
      style: { fontFamily: "Arial", fontSize: 16, fontWeight: "400" },
    },
  },
}

await bootstrapGraphVisualizer({
  themeSet,
})
```

When `themeSet` is omitted, the default light and dark graph themes can still be overridden from
`#app` with JSON-encoded `data-light-graph-theme` and `data-dark-graph-theme` attributes.

## HTML theme overrides

```html
<div
  id="app"
  data-graph-snapshot-url="/graph-snapshot.json"
  data-light-graph-theme='{"view":{"backgroundColor":16119285},"node":{"variants":{"default":{"fill":7893356,"stroke":16119284,"strokeWidth":1,"alpha":1},"selected":{"fill":789335,"stroke":16119284,"strokeWidth":2,"alpha":1},"muted":{"fill":14079761,"stroke":16119284,"strokeWidth":1,"alpha":0.45}},"scales":{"default":1,"selected":2,"muted":1}},"edge":{"variants":{"default":{"width":2,"color":5722958,"alpha":0.55},"muted":{"width":2,"color":11051678,"alpha":0.18}}},"label":{"variants":{"default":{"fill":789335,"alpha":1},"selected":{"fill":789335,"alpha":1},"muted":{"fill":7893356,"alpha":0.45}},"style":{"fontFamily":"Arial","fontSize":16,"fontWeight":"400"}}}'
  data-dark-graph-theme='{"view":{"backgroundColor":1777943},"node":{"variants":{"default":{"fill":11051678,"stroke":789335,"strokeWidth":1,"alpha":1},"selected":{"fill":16119284,"stroke":789335,"strokeWidth":2,"alpha":1},"muted":{"fill":4473924,"stroke":789335,"strokeWidth":1,"alpha":0.45}},"scales":{"default":1,"selected":2,"muted":1}},"edge":{"variants":{"default":{"width":2,"color":14079761,"alpha":0.5},"muted":{"width":2,"color":5722958,"alpha":0.25}}},"label":{"variants":{"default":{"fill":16119284,"alpha":1},"selected":{"fill":16119284,"alpha":1},"muted":{"fill":11051678,"alpha":0.45}},"style":{"fontFamily":"Arial","fontSize":16,"fontWeight":"400"}}}'
></div>
```
