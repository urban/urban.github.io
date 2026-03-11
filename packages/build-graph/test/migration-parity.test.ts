import { expect, test } from "bun:test"
import { buildGraphSnapshot } from "../src/core/build"
import { type ParsedWikilinkWithSource } from "../src/core/resolve"
import type {
  GraphSnapshot,
  GraphSnapshotEdge,
  GraphSnapshotNode,
  UnresolvedWikilinkDiagnostic,
} from "../src/domain/schema"
import type { ValidatedMarkdownFile } from "../src/core/validate"

type GraphSnapshotBaseSurface = Readonly<{
  readonly nodes: ReadonlyArray<GraphSnapshotNode>
  readonly edges: ReadonlyArray<GraphSnapshotEdge>
  readonly diagnostics: ReadonlyArray<UnresolvedWikilinkDiagnostic>
}>

const createValidatedNote = (
  relativePath: string,
  permalink: string,
  aliases: ReadonlyArray<string> = [],
): ValidatedMarkdownFile => ({
  relativePath,
  sourceRelativePath: relativePath,
  body: "",
  slug:
    permalink
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .pop() ?? permalink,
  routePath: permalink,
  nodeId: relativePath,
  label:
    permalink
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .pop() ?? permalink,
  frontmatter: {
    permalink,
    created: "2026-02-01",
    updated: "2026-02-02",
    aliases: [...aliases],
    published: true,
    title: undefined,
    description: undefined,
  },
})

const createWikilinkWithSource = (
  sourceRelativePath: string,
  target: string,
  displayText?: string,
): ParsedWikilinkWithSource => ({
  sourceRelativePath,
  raw: displayText === undefined ? `[[${target}]]` : `[[${target}|${displayText}]]`,
  target,
  displayText,
})

const toBaseSurface = (snapshot: GraphSnapshot): GraphSnapshotBaseSurface => ({
  nodes: snapshot.nodes,
  edges: snapshot.edges,
  diagnostics: snapshot.diagnostics,
})

test("preserves prior information surface in v2 arrays with no data loss", () => {
  const notes = [
    createValidatedNote("source.md", "/source"),
    createValidatedNote("nested/filename-target.md", "/filename-target"),
    createValidatedNote("path/target.md", "/path-target"),
    createValidatedNote("alias-target.md", "/alias-target", ["friendly-target"]),
  ]

  const snapshot = buildGraphSnapshot(notes, [
    createWikilinkWithSource("source.md", "filename-target"),
    createWikilinkWithSource("source.md", "path/target"),
    createWikilinkWithSource("source.md", "friendly-target", "Friendly"),
    createWikilinkWithSource("source.md", "missing/path"),
  ])

  expect(toBaseSurface(snapshot)).toEqual({
    nodes: [
      {
        id: "alias-target.md",
        kind: "note",
        relativePath: "alias-target.md",
        permalink: "/alias-target",
        sourceRelativePath: "alias-target.md",
        slug: "alias-target",
        routePath: "/alias-target",
        label: "alias-target",
        created: "2026-02-01",
        updated: "2026-02-02",
        aliases: ["friendly-target"],
        published: true,
      },
      {
        id: "nested/filename-target.md",
        kind: "note",
        relativePath: "nested/filename-target.md",
        permalink: "/filename-target",
        sourceRelativePath: "nested/filename-target.md",
        slug: "filename-target",
        routePath: "/filename-target",
        label: "filename-target",
        created: "2026-02-01",
        updated: "2026-02-02",
        aliases: [],
        published: true,
      },
      {
        id: "path/target.md",
        kind: "note",
        relativePath: "path/target.md",
        permalink: "/path-target",
        sourceRelativePath: "path/target.md",
        slug: "path-target",
        routePath: "/path-target",
        label: "path-target",
        created: "2026-02-01",
        updated: "2026-02-02",
        aliases: [],
        published: true,
      },
      {
        id: "placeholder:missing/path",
        kind: "placeholder",
        unresolvedTarget: "missing/path",
      },
      {
        id: "source.md",
        kind: "note",
        relativePath: "source.md",
        permalink: "/source",
        sourceRelativePath: "source.md",
        slug: "source",
        routePath: "/source",
        label: "source",
        created: "2026-02-01",
        updated: "2026-02-02",
        aliases: [],
        published: true,
      },
    ],
    edges: [
      {
        sourceNodeId: "source.md",
        targetNodeId: "alias-target.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[friendly-target|Friendly]]",
        target: "friendly-target",
        displayText: "Friendly",
        resolutionStrategy: "alias",
      },
      {
        sourceNodeId: "source.md",
        targetNodeId: "nested/filename-target.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[filename-target]]",
        target: "filename-target",
        resolutionStrategy: "path",
      },
      {
        sourceNodeId: "source.md",
        targetNodeId: "path/target.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[path/target]]",
        target: "path/target",
        resolutionStrategy: "path",
      },
      {
        sourceNodeId: "source.md",
        targetNodeId: "placeholder:missing/path",
        sourceRelativePath: "source.md",
        rawWikilink: "[[missing/path]]",
        target: "missing/path",
        resolutionStrategy: "unresolved",
      },
    ],
    diagnostics: [
      {
        type: "unresolved-wikilink",
        sourceRelativePath: "source.md",
        rawWikilink: "[[missing/path]]",
        target: "missing/path",
        placeholderNodeId: "placeholder:missing/path",
      },
    ],
  })
})

test("indexes are derivable from base surface and add lookup capability only", () => {
  const notes = [
    createValidatedNote("source.md", "/source"),
    createValidatedNote("target.md", "/target"),
  ]

  const snapshot = buildGraphSnapshot(notes, [createWikilinkWithSource("source.md", "target")])

  const baseSurface = toBaseSurface(snapshot)

  expect(snapshot.schemaVersion).toBe("2")
  expect(snapshot.indexes.nodesById["source.md"]).toEqual(baseSurface.nodes[0])
  expect(snapshot.indexes.nodesById["target.md"]).toEqual(baseSurface.nodes[1])
  expect(snapshot.indexes.edgesBySourceNodeId["source.md"]).toEqual(baseSurface.edges)
  expect(snapshot.indexes.edgesByTargetNodeId["target.md"]).toEqual(baseSurface.edges)
  expect(snapshot.indexes.noteNodeIdBySlug).toEqual({ source: "source.md", target: "target.md" })
  expect(snapshot.indexes.noteNodeIdByRoutePath).toEqual({
    "/source": "source.md",
    "/target": "target.md",
  })
  expect(baseSurface.diagnostics).toEqual([])
})
