import { expect, test } from "bun:test"
import type { GraphSnapshot } from "@urban/build-graph"
import { getVaultBacklinks, getVaultGraphModel, resolveSelectedVaultNodeId } from "./vaultGraph"

test("resolves canonical selected node ids for vault slugs with spaced source filenames", async () => {
  const { snapshot } = await getVaultGraphModel()

  expect(resolveSelectedVaultNodeId(snapshot, "harness-loop")).toBe("/vault/harness-loop")
  expect(resolveSelectedVaultNodeId(snapshot, "effect-runtime-boundary")).toBe(
    "/vault/effect-runtime-boundary",
  )
})

test("fails fast when a published vault slug has no node mapping", async () => {
  const { snapshot } = await getVaultGraphModel()

  expect(() => resolveSelectedVaultNodeId(snapshot, "missing-slug")).toThrow(
    "Missing vault graph node id for slug: missing-slug",
  )
})

test("aggregates incoming vault links into backlink counts per source page", () => {
  const snapshot: GraphSnapshot = {
    schemaVersion: "2",
    nodes: [
      {
        id: "/vault/alpha",
        kind: "note",
        relativePath: "alpha.md",
        permalink: "/alpha",
        slug: "alpha",
        routePath: "/vault/alpha",
        title: "Alpha",
      },
      {
        id: "/vault/beta",
        kind: "note",
        relativePath: "beta.md",
        permalink: "/beta",
        slug: "beta",
        routePath: "/vault/beta",
        title: "Beta",
      },
      {
        id: "/vault/gamma",
        kind: "note",
        relativePath: "gamma.md",
        permalink: "/gamma",
        slug: "gamma",
        routePath: "/vault/gamma",
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
        sourceNodeId: "/vault/beta",
        targetNodeId: "/vault/alpha",
        sourceRelativePath: "beta.md",
        rawWikilink: "[[alpha]]",
        target: "alpha",
        resolutionStrategy: "filename",
      },
      {
        sourceNodeId: "/vault/beta",
        targetNodeId: "/vault/alpha",
        sourceRelativePath: "beta.md",
        rawWikilink: "[[alpha|Alpha again]]",
        target: "alpha",
        displayText: "Alpha again",
        resolutionStrategy: "filename",
      },
      {
        sourceNodeId: "/vault/gamma",
        targetNodeId: "/vault/alpha",
        sourceRelativePath: "gamma.md",
        rawWikilink: "[[alpha]]",
        target: "alpha",
        resolutionStrategy: "filename",
      },
      {
        sourceNodeId: "placeholder:missing",
        targetNodeId: "/vault/alpha",
        sourceRelativePath: "missing.md",
        rawWikilink: "[[alpha]]",
        target: "alpha",
        resolutionStrategy: "unresolved",
      },
    ],
    diagnostics: [],
    indexes: {
      nodesById: {
        "/vault/alpha": {
          id: "/vault/alpha",
          kind: "note",
          relativePath: "alpha.md",
          permalink: "/alpha",
          slug: "alpha",
          routePath: "/vault/alpha",
          title: "Alpha",
        },
        "/vault/beta": {
          id: "/vault/beta",
          kind: "note",
          relativePath: "beta.md",
          permalink: "/beta",
          slug: "beta",
          routePath: "/vault/beta",
          title: "Beta",
        },
        "/vault/gamma": {
          id: "/vault/gamma",
          kind: "note",
          relativePath: "gamma.md",
          permalink: "/gamma",
          slug: "gamma",
          routePath: "/vault/gamma",
          title: "Gamma",
        },
        "placeholder:missing": {
          id: "placeholder:missing",
          kind: "placeholder",
          unresolvedTarget: "missing",
        },
      },
      edgesBySourceNodeId: {
        "/vault/beta": [
          {
            sourceNodeId: "/vault/beta",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "/vault/beta",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha|Alpha again]]",
            target: "alpha",
            displayText: "Alpha again",
            resolutionStrategy: "filename",
          },
        ],
        "/vault/gamma": [
          {
            sourceNodeId: "/vault/gamma",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "gamma.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
        ],
        "placeholder:missing": [
          {
            sourceNodeId: "placeholder:missing",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "missing.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "unresolved",
          },
        ],
      },
      edgesByTargetNodeId: {
        "/vault/alpha": [
          {
            sourceNodeId: "/vault/beta",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "/vault/beta",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "beta.md",
            rawWikilink: "[[alpha|Alpha again]]",
            target: "alpha",
            displayText: "Alpha again",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "/vault/gamma",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "gamma.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "filename",
          },
          {
            sourceNodeId: "placeholder:missing",
            targetNodeId: "/vault/alpha",
            sourceRelativePath: "missing.md",
            rawWikilink: "[[alpha]]",
            target: "alpha",
            resolutionStrategy: "unresolved",
          },
        ],
      },
      noteNodeIdBySlug: {
        alpha: "/vault/alpha",
        beta: "/vault/beta",
        gamma: "/vault/gamma",
      },
      noteNodeIdByRoutePath: {
        "/vault/alpha": "/vault/alpha",
        "/vault/beta": "/vault/beta",
        "/vault/gamma": "/vault/gamma",
      },
    },
  }

  expect(getVaultBacklinks(snapshot, "/vault/alpha")).toEqual([
    {
      count: 2,
      nodeId: "/vault/beta",
      routePath: "/vault/beta",
      slug: "beta",
      title: "Beta",
    },
    {
      count: 1,
      nodeId: "/vault/gamma",
      routePath: "/vault/gamma",
      slug: "gamma",
      title: "Gamma",
    },
  ])
})
