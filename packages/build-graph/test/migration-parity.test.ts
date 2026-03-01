import { expect, test } from "bun:test"
import { buildGraphSnapshot } from "../src/core/build"
import { buildWikilinkResolverV1Index, type ParsedWikilinkWithSource } from "../src/core/resolve"
import type {
  GraphSnapshot,
  GraphSnapshotEdge,
  GraphSnapshotNode,
  UnresolvedWikilinkDiagnostic,
} from "../src/domain/schema"
import type { ValidatedMarkdownFile } from "../src/core/validate"

type LegacyGraphSnapshotV1Surface = Readonly<{
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
  body: "",
  frontmatter: {
    permalink,
    created: "2026-02-01",
    updated: "2026-02-02",
    aliases: [...aliases],
    published: true,
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

const toV1Surface = (snapshot: GraphSnapshot): LegacyGraphSnapshotV1Surface => ({
  nodes: snapshot.nodes,
  edges: snapshot.edges,
  diagnostics: snapshot.diagnostics,
})

test("preserves v1 information surface in v2 arrays with no data loss", () => {
  const notes = [
    createValidatedNote("source.md", "/source"),
    createValidatedNote("nested/filename-target.md", "/filename-target"),
    createValidatedNote("path/target.md", "/path-target"),
    createValidatedNote("alias-target.md", "/alias-target", ["friendly-target"]),
  ]

  const resolverV1Index = buildWikilinkResolverV1Index(notes)
  const snapshot = buildGraphSnapshot(notes, resolverV1Index, [
    createWikilinkWithSource("source.md", "filename-target"),
    createWikilinkWithSource("source.md", "path/target"),
    createWikilinkWithSource("source.md", "friendly-target", "Friendly"),
    createWikilinkWithSource("source.md", "missing/path"),
  ])

  expect(toV1Surface(snapshot)).toEqual({
    nodes: [
      {
        id: "alias-target.md",
        kind: "note",
        relativePath: "alias-target.md",
        permalink: "/alias-target",
      },
      {
        id: "nested/filename-target.md",
        kind: "note",
        relativePath: "nested/filename-target.md",
        permalink: "/filename-target",
      },
      {
        id: "path/target.md",
        kind: "note",
        relativePath: "path/target.md",
        permalink: "/path-target",
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
        resolutionStrategy: "filename",
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

test("indexes are derivable from v1 surface and add lookup capability only", () => {
  const notes = [
    createValidatedNote("source.md", "/source"),
    createValidatedNote("target.md", "/target"),
  ]

  const resolverV1Index = buildWikilinkResolverV1Index(notes)
  const snapshot = buildGraphSnapshot(notes, resolverV1Index, [
    createWikilinkWithSource("source.md", "target"),
  ])

  const v1Surface = toV1Surface(snapshot)

  expect(snapshot.schemaVersion).toBe("2")
  expect(snapshot.indexes.nodesById["source.md"]).toEqual(v1Surface.nodes[0])
  expect(snapshot.indexes.nodesById["target.md"]).toEqual(v1Surface.nodes[1])
  expect(snapshot.indexes.edgesBySourceNodeId["source.md"]).toEqual(v1Surface.edges)
  expect(snapshot.indexes.edgesByTargetNodeId["target.md"]).toEqual(v1Surface.edges)
  expect(v1Surface.diagnostics).toEqual([])
})
