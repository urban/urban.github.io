import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Exit } from "effect"
import { runWithArgs } from "../src/cli/main"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "graph-view-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("writes graph markdown with note nodes and unlabeled edges from a snapshot file", async () => {
  const fromRoot = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const from = join(fromRoot, "graph-snapshot.json")
  const to = join(toRoot, "docs", "graph.md")

  await writeFile(
    from,
    JSON.stringify(
      {
        nodes: [
          {
            id: "notes/z.md",
            kind: "note",
            relativePath: "notes/z.md",
            permalink: "/z",
          },
          {
            id: "notes/a.md",
            kind: "note",
            relativePath: "notes/a.md",
            permalink: "/a",
          },
        ],
        edges: [
          {
            sourceNodeId: "notes/a.md",
            targetNodeId: "notes/z.md",
            sourceRelativePath: "notes/a.md",
            rawWikilink: "[[z|Z]]",
            target: "z",
            displayText: "Z",
            resolutionStrategy: "path",
          },
        ],
        diagnostics: [],
      },
      null,
      2,
    ),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const markdown = await readFile(to, "utf8")
  expect(markdown).toBe(
    '## Graph\n\n```mermaid\ngraph LR\n  n0["notes/a.md"]\n  n1["notes/z.md"]\n  n0 --> n1\n```\n',
  )
})
