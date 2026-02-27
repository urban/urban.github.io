import { expect, test } from "bun:test"
import { buildWikilinkResolverV1Index, resolveWikilinkTargetV1 } from "../src/core/resolve"
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

test("returns unresolved when no candidate matches path or filename", () => {
  const notes = [createValidatedNote("docs/guide.md", "/docs/guide")]

  const index = buildWikilinkResolverV1Index(notes)
  const result = resolveWikilinkTargetV1(index, "unknown-target")

  expect(result.strategy).toBe("unresolved")
  expect(result.candidates).toEqual([])
})
