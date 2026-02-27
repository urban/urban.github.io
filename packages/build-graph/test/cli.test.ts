import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Exit } from "effect"
import {
  GRAPH_SNAPSHOT_BACKUP_FILE_NAME,
  GRAPH_SNAPSHOT_FILE_NAME,
  runWithArgs,
} from "../src/cli/main"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-graph-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("writes a deterministic blank graph snapshot", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  const snapshot = await readFile(snapshotPath, "utf8")

  expect(snapshot).toBe(`{\n  "nodes": [],\n  "edges": [],\n  "diagnostics": []\n}\n`)
})

test("backs up an existing snapshot before overwrite", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()
  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  const previousSnapshot = `{\n  "nodes": [{ "id": "old" }],\n  "edges": [],\n  "diagnostics": []\n}\n`

  await writeFile(snapshotPath, previousSnapshot)

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const backupPath = join(to, GRAPH_SNAPSHOT_BACKUP_FILE_NAME)
  const backupSnapshot = await readFile(backupPath, "utf8")
  const currentSnapshot = await readFile(snapshotPath, "utf8")

  expect(backupSnapshot).toBe(previousSnapshot)
  expect(currentSnapshot).toBe(`{\n  "nodes": [],\n  "edges": [],\n  "diagnostics": []\n}\n`)
})

test("validates that from is an existing directory", async () => {
  const fromRoot = await makeTempDirectory()
  const missingFrom = join(fromRoot, "missing")
  const to = await makeTempDirectory()

  const result = await Effect.runPromiseExit(runWithArgs([missingFrom, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  await expect(readFile(snapshotPath, "utf8")).rejects.toThrow()
})

test("validates that to is a directory when it already exists", async () => {
  const from = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const toFile = join(toRoot, "not-a-directory.txt")

  await writeFile(toFile, "hello")

  const result = await Effect.runPromiseExit(runWithArgs([from, toFile]))
  expect(Exit.isFailure(result)).toBeTrue()

  const snapshotPath = join(toFile, GRAPH_SNAPSHOT_FILE_NAME)
  await expect(readFile(snapshotPath, "utf8")).rejects.toThrow()
})

test("fails before writing snapshot when frontmatter is invalid", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()

  await writeFile(
    join(from, "invalid.md"),
    `---\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n# invalid\n`,
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  await expect(readFile(snapshotPath, "utf8")).rejects.toThrow()
})

test("fails before writing snapshot when duplicate permalinks exist", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()

  await writeFile(
    join(from, "a.md"),
    `---\npermalink: /same\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n# a\n`,
  )
  await writeFile(
    join(from, "b.md"),
    `---\npermalink: /same\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n# b\n`,
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  await expect(readFile(snapshotPath, "utf8")).rejects.toThrow()
})

test("fails before writing snapshot when wikilink resolution is ambiguous", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()

  await mkdir(join(from, "a"), { recursive: true })
  await mkdir(join(from, "z"), { recursive: true })

  await writeFile(
    join(from, "source.md"),
    `---\npermalink: /source\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n[[foo]]\n`,
  )
  await writeFile(
    join(from, "a", "foo.md"),
    `---\npermalink: /a/foo\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n# a\n`,
  )
  await writeFile(
    join(from, "z", "foo.md"),
    `---\npermalink: /z/foo\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n# z\n`,
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isFailure(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  await expect(readFile(snapshotPath, "utf8")).rejects.toThrow()
})

test("writes placeholder nodes and unresolved diagnostics for unresolved wikilinks", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()

  await writeFile(
    join(from, "source.md"),
    [
      "---",
      "permalink: /source",
      "created: 2026-02-27",
      "updated: 2026-02-27",
      "---",
      "[[missing/note]] [[target]]",
      "",
    ].join("\n"),
  )
  await writeFile(
    join(from, "target.md"),
    [
      "---",
      "permalink: /target",
      "created: 2026-02-27",
      "updated: 2026-02-27",
      "---",
      "# target",
      "",
    ].join("\n"),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"))

  expect(snapshot).toEqual({
    nodes: [
      {
        id: "placeholder:missing/note",
        kind: "placeholder",
        unresolvedTarget: "missing/note",
      },
      {
        id: "source.md",
        kind: "note",
        relativePath: "source.md",
        permalink: "/source",
      },
      {
        id: "target.md",
        kind: "note",
        relativePath: "target.md",
        permalink: "/target",
      },
    ],
    edges: [
      {
        sourceNodeId: "source.md",
        targetNodeId: "placeholder:missing/note",
        sourceRelativePath: "source.md",
        rawWikilink: "[[missing/note]]",
        target: "missing/note",
        resolutionStrategy: "unresolved",
      },
      {
        sourceNodeId: "source.md",
        targetNodeId: "target.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[target]]",
        target: "target",
        resolutionStrategy: "path",
      },
    ],
    diagnostics: [
      {
        type: "unresolved-wikilink",
        sourceRelativePath: "source.md",
        rawWikilink: "[[missing/note]]",
        target: "missing/note",
        placeholderNodeId: "placeholder:missing/note",
      },
    ],
  })
})
