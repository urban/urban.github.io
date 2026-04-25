import { expect, mock, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import type { GraphSnapshot } from "@urban/build-graph/schema"

mock.module("next/navigation", () => ({
  usePathname: () => "/garden/alpha",
  useRouter: () => ({
    push: (_href: string) => undefined,
  }),
}))

const { GraphHost } = await import("./GraphHost")

const snapshot: GraphSnapshot = {
  schemaVersion: "2",
  nodes: [
    {
      id: "/garden/alpha",
      kind: "note",
      relativePath: "Alpha.md",
      permalink: "/alpha",
      slug: "alpha",
      routePath: "/garden/alpha",
    },
  ],
  edges: [],
  diagnostics: [],
  indexes: {
    nodesById: {
      "/garden/alpha": {
        id: "/garden/alpha",
        kind: "note",
        relativePath: "Alpha.md",
        permalink: "/alpha",
        slug: "alpha",
        routePath: "/garden/alpha",
      },
    },
    edgesBySourceNodeId: {},
    edgesByTargetNodeId: {},
    noteNodeIdBySlug: {
      alpha: "/garden/alpha",
    },
    noteNodeIdByRoutePath: {
      "/garden/alpha": "/garden/alpha",
    },
  },
}

test("renders inline snapshot payload and selected node config", () => {
  const markup = renderToStaticMarkup(
    <GraphHost snapshot={snapshot} selectedNodeId="/garden/alpha" />,
  )

  expect(markup).toContain('id="app"')
  expect(markup).toContain('data-selected-node-id="/garden/alpha"')
  expect(markup).not.toContain("data-light-graph-theme=")
  expect(markup).not.toContain("data-dark-graph-theme=")
  expect(markup).toContain('type="application/json"')
  expect(markup).toContain('"/garden/alpha"')
})
