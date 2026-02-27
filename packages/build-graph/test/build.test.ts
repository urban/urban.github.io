import { expect, test } from "bun:test"
import { buildGraphSnapshot } from "../src/core/build"
import { buildWikilinkResolverV1Index, type ParsedWikilinkWithSource } from "../src/core/resolve"
import type { ValidatedMarkdownFile } from "../src/core/validate"

const createValidatedNote = (relativePath: string, permalink: string): ValidatedMarkdownFile => ({
  absolutePath: `/notes/${relativePath}`,
  relativePath,
  body: "",
  frontmatter: {
    permalink,
    created: "2026-02-01",
    updated: "2026-02-02",
    aliases: [],
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

test("creates and reuses placeholder nodes for unresolved wikilinks", () => {
  const notes = [
    createValidatedNote("source-a.md", "/source-a"),
    createValidatedNote("source-b.md", "/source-b"),
    createValidatedNote("target.md", "/target"),
  ]

  const resolverV1Index = buildWikilinkResolverV1Index(notes)
  const snapshot = buildGraphSnapshot(notes, resolverV1Index, [
    createWikilinkWithSource("source-a.md", "missing/path"),
    createWikilinkWithSource("source-b.md", "Missing/Path", "Missing"),
    createWikilinkWithSource("source-a.md", "target"),
  ])

  const placeholderNodes = snapshot.nodes.filter((node) => node.kind === "placeholder")
  expect(placeholderNodes).toEqual([
    {
      id: "placeholder:missing/path",
      kind: "placeholder",
      unresolvedTarget: "missing/path",
    },
  ])

  const unresolvedEdges = snapshot.edges.filter((edge) => edge.resolutionStrategy === "unresolved")
  expect(unresolvedEdges).toHaveLength(2)
  expect(unresolvedEdges.map((edge) => edge.targetNodeId)).toEqual([
    "placeholder:missing/path",
    "placeholder:missing/path",
  ])

  expect(snapshot.diagnostics).toEqual([
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "source-a.md",
      rawWikilink: "[[missing/path]]",
      target: "missing/path",
      placeholderNodeId: "placeholder:missing/path",
    },
    {
      type: "unresolved-wikilink",
      sourceRelativePath: "source-b.md",
      rawWikilink: "[[Missing/Path|Missing]]",
      target: "Missing/Path",
      placeholderNodeId: "placeholder:missing/path",
    },
  ])
})
