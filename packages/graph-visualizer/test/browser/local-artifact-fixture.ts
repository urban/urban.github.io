import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { renderHtmlFromSnapshot } from "../../src/core/render-html"
import type { GraphSnapshot } from "../../src/domain/schema"

type ArtifactFixture = {
  readonly artifactDir: string
  readonly htmlPath: string
  readonly cleanup: () => void
}

const representativeSnapshot: GraphSnapshot = {
  schemaVersion: "2",
  nodes: [
    {
      id: "notes/a.md",
      kind: "note",
      relativePath: "notes/a.md",
      permalink: "/a",
    },
    {
      id: "notes/b.md",
      kind: "note",
      relativePath: "notes/b.md",
      permalink: "/b",
    },
    {
      id: "placeholder:missing/topic",
      kind: "placeholder",
      unresolvedTarget: "missing/topic",
    },
  ],
  edges: [
    {
      sourceNodeId: "notes/a.md",
      targetNodeId: "notes/b.md",
      sourceRelativePath: "notes/a.md",
      rawWikilink: "[[b]]",
      target: "b",
      resolutionStrategy: "path",
    },
    {
      sourceNodeId: "notes/b.md",
      targetNodeId: "placeholder:missing/topic",
      sourceRelativePath: "notes/b.md",
      rawWikilink: "[[missing/topic]]",
      target: "missing/topic",
      resolutionStrategy: "unresolved",
    },
  ],
  diagnostics: [
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "notes/b.md",
      rawWikilink: "[[missing/topic]]",
      target: "missing/topic",
      placeholderNodeId: "placeholder:missing/topic",
    },
  ],
  indexes: {
    nodesById: {
      "notes/a.md": {
        id: "notes/a.md",
        kind: "note",
        relativePath: "notes/a.md",
        permalink: "/a",
      },
      "notes/b.md": {
        id: "notes/b.md",
        kind: "note",
        relativePath: "notes/b.md",
        permalink: "/b",
      },
      "placeholder:missing/topic": {
        id: "placeholder:missing/topic",
        kind: "placeholder",
        unresolvedTarget: "missing/topic",
      },
    },
    edgesBySourceNodeId: {
      "notes/a.md": [
        {
          sourceNodeId: "notes/a.md",
          targetNodeId: "notes/b.md",
          sourceRelativePath: "notes/a.md",
          rawWikilink: "[[b]]",
          target: "b",
          resolutionStrategy: "path",
        },
      ],
      "notes/b.md": [
        {
          sourceNodeId: "notes/b.md",
          targetNodeId: "placeholder:missing/topic",
          sourceRelativePath: "notes/b.md",
          rawWikilink: "[[missing/topic]]",
          target: "missing/topic",
          resolutionStrategy: "unresolved",
        },
      ],
    },
    edgesByTargetNodeId: {
      "notes/b.md": [
        {
          sourceNodeId: "notes/a.md",
          targetNodeId: "notes/b.md",
          sourceRelativePath: "notes/a.md",
          rawWikilink: "[[b]]",
          target: "b",
          resolutionStrategy: "path",
        },
      ],
      "placeholder:missing/topic": [
        {
          sourceNodeId: "notes/b.md",
          targetNodeId: "placeholder:missing/topic",
          sourceRelativePath: "notes/b.md",
          rawWikilink: "[[missing/topic]]",
          target: "missing/topic",
          resolutionStrategy: "unresolved",
        },
      ],
    },
  },
}

export const createLocalArtifactFixture = (): ArtifactFixture => {
  const artifactDir = mkdtempSync(join(tmpdir(), "graph-visualizer-playwriter-"))
  const htmlPath = join(artifactDir, "graph.html")
  const html = renderHtmlFromSnapshot(representativeSnapshot)
  writeFileSync(htmlPath, html, "utf8")

  return {
    artifactDir,
    htmlPath,
    cleanup: () => {
      rmSync(artifactDir, { force: true, recursive: true })
    },
  }
}
