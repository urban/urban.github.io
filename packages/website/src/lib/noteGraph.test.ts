import { expect, test } from "bun:test"
import type { GraphSnapshot } from "@urban/build-graph"
import { getBacklinks, getGraphModel, resolveSelectedNodeId } from "./noteGraph"

test("resolves canonical selected node ids for published garden slugs with spaced source filenames", async () => {
  const { snapshot } = await getGraphModel()

  expect(resolveSelectedNodeId(snapshot, "index")).toBe("/garden/index")
  expect(resolveSelectedNodeId(snapshot, "what-is-a-digital-garden")).toBe(
    "/garden/what-is-a-digital-garden",
  )
})

test("fails fast when a published vault slug has no node mapping", async () => {
  const { snapshot } = await getGraphModel()

  expect(() => resolveSelectedNodeId(snapshot, "missing-slug")).toThrow(
    "Missing garden graph node id for slug: missing-slug",
  )
})

test("aggregates incoming vault links into backlink counts per source page", () => {
  const snapshot: GraphSnapshot = {
    schemaVersion: "2",
    nodes: [
      {
        id: "/garden/alpha",
        kind: "note",
        relativePath: "alpha.md",
        permalink: "/alpha",
        slug: "alpha",
        routePath: "/garden/alpha",
        title: "Alpha",
      },
      {
        id: "/garden/beta",
        kind: "note",
        relativePath: "beta.md",
        permalink: "/beta",
        slug: "beta",
        routePath: "/garden/beta",
        title: "Beta",
      },
      {
        id: "/garden/gamma",
        kind: "note",
        relativePath: "gamma.md",
        permalink: "/gamma",
        slug: "gamma",
        routePath: "/garden/gamma",
        title: "Gamma",
      },
      {
        id: "placeholder:missing",
        kind: "placeholder",
        unresolvedTarget: "missing",
      },
    ],
    edges: [
      {
        sourceNodeId: "/garden/beta",
        targetNodeId: "/garden/alpha",
        sourceRelativePath: "beta.md",
        rawWikilink: "[[alpha]]",
        target: "alpha",
        resolutionStrategy: "filename",
      },
      {
        sourceNodeId: "/garden/beta",
        targetNodeId: "/garden/alpha",
        sourceRelativePath: "beta.md",
        rawWikilink: "[[alpha|Alpha again]]",
        target: "alpha",
        displayText: "Alpha again",
        resolutionStrategy: "filename",
      },
      {
        sourceNodeId: "/garden/gamma",
        targetNodeId: "/garden/alpha",
        sourceRelativePath: "gamma.md",
        rawWikilink: "[[alpha]]",
        target: "alpha",
        resolutionStrategy: "filename",
      },
      {
        sourceNodeId: "placeholder:missing",
        targetNodeId: "/garden/alpha",
        sourceRelativePath: "missing.md",
        rawWikilink: "[[alpha]]",
        target: "alpha",
        resolutionStrategy: "unresolved",
      },
    ],
    diagnostics: [],
    indexes: {
      nodesById: {
        "/garden/alpha": {
          id: "/garden/alpha",
          kind: "note",
          relativePath: "alpha.md",
          permalink: "/alpha",
          slug: "alpha",
          routePath: "/garden/alpha",
          title: "Alpha",
        },
        "/garden/beta": {
          id: "/garden/beta",
          kind: "note",
          relativePath: "beta.md",
          permalink: "/beta",
          slug: "beta",
          routePath: "/garden/beta",
          title: "Beta",
        },
        "/garden/gamma": {
          id: "/garden/gamma",
          kind: "note",
          relativePath: "gamma.md",
          permalink: "/gamma",
          slug: "gamma",
          routePath: "/garden/gamma",
          title: "Gamma",
        },
        "placeholder:missing": {
          id: "placeholder:missing",
          kind: "placeholder",
          unresolvedTarget: "missing",
        },
      },
      edgesBySourceNodeId: {
        "/garden/beta": [
          {
            sourceNodeId: "/garden/beta",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "/garden/beta",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha|Alpha again]]",
            target: "alpha",
            displayText: "Alpha again",
            resolutionStrategy: "filename",
          },
        ],
        "/garden/gamma": [
          {
            sourceNodeId: "/garden/gamma",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "gamma.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
        ],
        "placeholder:missing": [
          {
            sourceNodeId: "placeholder:missing",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "missing.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "unresolved",
          },
        ],
      },
      edgesByTargetNodeId: {
        "/garden/alpha": [
          {
            sourceNodeId: "/garden/beta",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "/garden/beta",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha|Alpha again]]",
            target: "alpha",
            displayText: "Alpha again",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "/garden/gamma",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "gamma.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "placeholder:missing",
            targetNodeId: "/garden/alpha",
            sourceRelativePath: "missing.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "unresolved",
          },
        ],
      },
      noteNodeIdBySlug: {
        alpha: "/garden/alpha",
        beta: "/garden/beta",
        gamma: "/garden/gamma",
      },
      noteNodeIdByRoutePath: {
        "/garden/alpha": "/garden/alpha",
        "/garden/beta": "/garden/beta",
        "/garden/gamma": "/garden/gamma",
      },
    },
  }

  expect(getBacklinks(snapshot, "/garden/alpha")).toEqual([
    {
      count: 2,
      nodeId: "/garden/beta",
      routePath: "/garden/beta",
      slug: "beta",
      title: "Beta",
    },
    {
      count: 1,
      nodeId: "/garden/gamma",
      routePath: "/garden/gamma",
      slug: "gamma",
      title: "Gamma",
    },
  ])
})
