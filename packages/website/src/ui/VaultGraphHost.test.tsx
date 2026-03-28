import { expect, mock, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import type { GraphSnapshot } from "@urban/build-graph/schema"

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
  expect(markup).not.toContain("data-light-graph-theme=")
  expect(markup).not.toContain("data-dark-graph-theme=")
  expect(markup).toContain('type="application/json"')
  expect(markup).toContain('"/vault/alpha"')
})
