import { expect, test } from "bun:test"
import {
  buildWikilinkResolverV1Index,
  resolveWikilinkTargetV1,
  summarizeWikilinkResolutionsV1,
  type ParsedWikilinkWithSource,
} from "../src/core/resolve"
import type { ValidatedMarkdownFile } from "../src/core/validate"

const createValidatedNote = (
  relativePath: string,
  permalink: string,
  aliases: ReadonlyArray<string> = [],
): ValidatedMarkdownFile => ({
  absolutePath: `/notes/${relativePath}`,
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
): ParsedWikilinkWithSource => ({
  sourceRelativePath,
  raw: `[[${target}]]`,
  target,
  displayText: undefined,
})

test("uses case-insensitive path matching before filename matching", () => {
  const notes = [
    createValidatedNote("projects/Alpha.MD", "/projects/alpha"),
    createValidatedNote("alpha.md", "/alpha"),
  ]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "PROJECTS/alpha")

  expect(result.strategy).toBe("path")
  expect(result.candidates.map((candidate) => candidate.relativePath)).toEqual([
    "projects/Alpha.MD",
  ])
})

test("falls back to case-insensitive filename matching when no path match exists", () => {
  const notes = [createValidatedNote("docs/guide.md", "/docs/guide")]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "missing-folder/GUIDE")

  expect(result.strategy).toBe("filename")
  expect(result.candidates.map((candidate) => candidate.relativePath)).toEqual(["docs/guide.md"])
})

test("returns deterministically sorted candidates for ambiguous filename matches", () => {
  const notes = [
    createValidatedNote("z/foo.md", "/z/foo"),
    createValidatedNote("a/foo.md", "/a/foo"),
  ]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "foo")

  expect(result.strategy).toBe("filename")
  expect(result.candidates.map((candidate) => candidate.relativePath)).toEqual([
    "a/foo.md",
    "z/foo.md",
  ])
})

test("falls back to case-insensitive alias matching when no path or filename match exists", () => {
  const notes = [createValidatedNote("docs/guide.md", "/docs/guide", ["How To Guide"])]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "how to guide")

  expect(result.strategy).toBe("alias")
  expect(result.candidates.map((candidate) => candidate.relativePath)).toEqual(["docs/guide.md"])
})

test("uses filename matching before alias matching when both could match", () => {
  const notes = [
    createValidatedNote("docs/guide.md", "/docs/guide"),
    createValidatedNote("misc/overview.md", "/misc/overview", ["guide"]),
  ]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "guide")

  expect(result.strategy).toBe("filename")
  expect(result.candidates.map((candidate) => candidate.relativePath)).toEqual(["docs/guide.md"])
})

test("returns deterministically sorted candidates for ambiguous alias matches", () => {
  const notes = [
    createValidatedNote("z/foo.md", "/z/foo", ["roadmap"]),
    createValidatedNote("a/foo.md", "/a/foo", ["ROADMAP"]),
  ]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "roadmap")

  expect(result.strategy).toBe("alias")
  expect(result.candidates.map((candidate) => candidate.relativePath)).toEqual([
    "a/foo.md",
    "z/foo.md",
  ])
})

test("returns unresolved when no candidate matches path, filename, or alias", () => {
  const notes = [createValidatedNote("docs/guide.md", "/docs/guide")]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "unknown-target")

  expect(result.strategy).toBe("unresolved")
  expect(result.candidates).toEqual([])
})

test("summarizes resolved counts while excluding unresolved and ambiguous matches", () => {
  const notes = [
    createValidatedNote("a/foo.md", "/a/foo"),
    createValidatedNote("z/foo.md", "/z/foo"),
    createValidatedNote("docs/guide.md", "/docs/guide"),
  ]

  const index = buildWikilinkResolverV1Index(notes)
  const summary = summarizeWikilinkResolutionsV1(index, [
    createWikilinkWithSource("source.md", "foo"),
    createWikilinkWithSource("source.md", "guide"),
    createWikilinkWithSource("source.md", "missing"),
  ])

  expect(summary.resolvedCount).toBe(1)
  expect(summary.ambiguousDiagnostics).toEqual([
    {
      sourceRelativePath: "source.md",
      rawWikilink: "[[foo]]",
      target: "foo",
      strategy: "filename",
      candidateRelativePaths: ["a/foo.md", "z/foo.md"],
    },
  ])
})
