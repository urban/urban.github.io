import type { GraphTheme, GraphThemeSet } from "@urban/graph-view"

export const LIGHT_GRAPH_THEME: GraphTheme = {
  view: { backgroundColor: 0xf1f1ed },
  node: {
    variants: {
      default: { fill: 0x57534e, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 1 },
      selected: { fill: 0x2a68a6, stroke: 0xf7f7f3, strokeWidth: 2, alpha: 1 },
      muted: { fill: 0xd6d3d1, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 0.4 },
    },
    scales: {
      default: 1,
      selected: 2.5,
      muted: 1,
    },
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
      selected: { fill: 0x2a68a6, alpha: 1 },
      muted: { fill: 0x78716c, alpha: 0.45 },
    },
    style: {
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "400",
    },
  },
}

export const DARK_GRAPH_THEME: GraphTheme = {
  view: { backgroundColor: 0x232c36 },
  node: {
    variants: {
      default: { fill: 0xd6d3d1, stroke: 0x1c1917, strokeWidth: 1, alpha: 1 },
      selected: { fill: 0x92bfec, stroke: 0x1c222a, strokeWidth: 2, alpha: 1 },
      muted: { fill: 0x44403c, stroke: 0x1c1917, strokeWidth: 1, alpha: 0.4 },
    },
    scales: {
      default: 1,
      selected: 2,
      muted: 1,
    },
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
      selected: { fill: 0xf5f5f4, alpha: 1 },
      muted: { fill: 0xa8a29e, alpha: 0.45 },
    },
    style: {
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "400",
    },
  },
}

export const GRAPH_THEME_SET: GraphThemeSet = {
  light: LIGHT_GRAPH_THEME,
  dark: DARK_GRAPH_THEME,
}
