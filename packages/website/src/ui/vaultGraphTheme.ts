import type { GraphTheme, GraphThemeSet } from "@urban/graph-view"

export const LIGHT_VAULT_GRAPH_THEME: GraphTheme = {
  view: { backgroundColor: 0xfafaf9 },
  node: {
    variants: {
      default: { fill: 0x57534e, stroke: 0xf5f5f4, strokeWidth: 1, alpha: 1 },
      selected: { fill: 0x57534e, stroke: 0xf5f5f4, strokeWidth: 2, alpha: 1 },
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
      selected: { fill: 0x9a3412, alpha: 1 },
      muted: { fill: 0x78716c, alpha: 0.45 },
    },
    style: {
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "400",
    },
  },
}

export const DARK_VAULT_GRAPH_THEME: GraphTheme = {
  view: { backgroundColor: 0x0c0a09 },
  node: {
    variants: {
      default: { fill: 0xd6d3d1, stroke: 0x1c1917, strokeWidth: 1, alpha: 1 },
      selected: { fill: 0xfb923c, stroke: 0x7c2d12, strokeWidth: 2, alpha: 1 },
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
      selected: { fill: 0xfdba74, alpha: 1 },
      muted: { fill: 0xa8a29e, alpha: 0.45 },
    },
    style: {
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "400",
    },
  },
}

export const VAULT_GRAPH_THEME_SET: GraphThemeSet = {
  light: LIGHT_VAULT_GRAPH_THEME,
  dark: DARK_VAULT_GRAPH_THEME,
}
