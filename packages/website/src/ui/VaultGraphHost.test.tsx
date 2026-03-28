import { expect, mock, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import type { GraphSnapshot } from "@urban/build-graph/schema"
import {
  DARK_VAULT_GRAPH_THEME,
  LIGHT_VAULT_GRAPH_THEME,
  serializeGraphTheme,
} from "./vaultGraphTheme"

mock.module("next/navigation", () => ({
  usePathname: () => "/vault/alpha",
  useRouter: () => ({
    push: (_href: string) => undefined,
  }),
}))

const { VaultGraphHost } = await import("./VaultGraphHost")

const snapshot: GraphSnapshot = {
  schemaVersion: "2",
  nodes: [
    {
      id: "/vault/alpha",
      kind: "note",
      relativePath: "Alpha.md",
      permalink: "/alpha",
      slug: "alpha",
      routePath: "/vault/alpha",
    },
  ],
  edges: [],
  diagnostics: [],
  indexes: {
    nodesById: {
      "/vault/alpha": {
        id: "/vault/alpha",
        kind: "note",
        relativePath: "Alpha.md",
        permalink: "/alpha",
        slug: "alpha",
        routePath: "/vault/alpha",
      },
    },
    edgesBySourceNodeId: {},
    edgesByTargetNodeId: {},
    noteNodeIdBySlug: {
      alpha: "/vault/alpha",
    },
    noteNodeIdByRoutePath: {
      "/vault/alpha": "/vault/alpha",
    },
  },
}

test("renders inline snapshot payload and selected node config", () => {
  const markup = renderToStaticMarkup(
    <VaultGraphHost snapshot={snapshot} selectedNodeId="/vault/alpha" />,
  )

  expect(markup).toContain('id="app"')
  expect(markup).toContain('data-selected-node-id="/vault/alpha"')
  expect(markup).toContain(
    `data-light-graph-theme="${serializeGraphTheme(LIGHT_VAULT_GRAPH_THEME).replaceAll('"', "&quot;")}"`,
  )
  expect(markup).toContain(
    `data-dark-graph-theme="${serializeGraphTheme(DARK_VAULT_GRAPH_THEME).replaceAll('"', "&quot;")}"`,
  )
  expect(markup).toContain('type="application/json"')
  expect(markup).toContain('"/vault/alpha"')
})
