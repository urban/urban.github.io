import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect, Exit, Option, Result, Schema } from "effect"
import {
  BuildGraphCliValidationError,
  GRAPH_SNAPSHOT_BACKUP_FILE_NAME,
  GRAPH_SNAPSHOT_FILE_NAME,
  runWithArgs,
} from "../src/cli/main"
import { GraphSnapshotSchema } from "../src/domain/schema"

const tempDirectories = new Set<string>()
const decodeGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

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

  expect(snapshot).toBe(
    `{\n  "schemaVersion": "2",\n  "nodes": [],\n  "edges": [],\n  "diagnostics": [],\n  "indexes": {\n    "nodesById": {},\n    "edgesBySourceNodeId": {},\n    "edgesByTargetNodeId": {},\n    "noteNodeIdBySlug": {},\n    "noteNodeIdByRoutePath": {}\n  }\n}\n`,
  )
})

test("writes byte-identical snapshots for unchanged input across runs", async () => {
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
      "[[target]] [[missing/note]]",
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

  const firstResult = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(firstResult)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  const firstSnapshot = await readFile(snapshotPath, "utf8")

  const secondResult = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(secondResult)).toBeTrue()

  const secondSnapshot = await readFile(snapshotPath, "utf8")
  const backupSnapshot = await readFile(join(to, GRAPH_SNAPSHOT_BACKUP_FILE_NAME), "utf8")

  expect(secondSnapshot).toBe(firstSnapshot)
  expect(backupSnapshot).toBe(firstSnapshot)
})

test("writes v2 snapshot for resolved-only wikilink happy path", async () => {
  const from = await makeTempDirectory()
  const to = await makeTempDirectory()

  await mkdir(join(from, "nested"), { recursive: true })
  await writeFile(
    join(from, "source.md"),
    [
      "---",
      "permalink: /source",
      "created: 2026-02-27",
      "updated: 2026-02-27",
      "aliases: [Start]",
      "---",
      "[[nested/target]] [[target-two]] [[Launch Target]]",
      "",
    ].join("\n"),
  )
  await writeFile(
    join(from, "nested", "target.md"),
    [
      "---",
      "permalink: /nested-target",
      "created: 2026-02-27",
      "updated: 2026-02-27",
      "---",
      "# nested target",
      "",
    ].join("\n"),
  )
  await writeFile(
    join(from, "target-two.md"),
    [
      "---",
      "permalink: /target-two",
      "created: 2026-02-27",
      "updated: 2026-02-27",
      "aliases: [Launch Target]",
      "---",
      "# target two",
      "",
    ].join("\n"),
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, to]))
  expect(Exit.isSuccess(result)).toBeTrue()

  const snapshotPath = join(to, GRAPH_SNAPSHOT_FILE_NAME)
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"))

  expect(snapshot).toEqual({
    schemaVersion: "2",
    nodes: [
      {
        id: "nested/target.md",
        kind: "note",
        relativePath: "nested/target.md",
        permalink: "/nested-target",
        sourceRelativePath: "nested/target.md",
        slug: "nested-target",
        routePath: "/nested-target",
        label: "Nested Target",
        created: "2026-02-27",
        updated: "2026-02-27",
        aliases: [],
        published: true,
      },
      {
        id: "source.md",
        kind: "note",
        relativePath: "source.md",
        permalink: "/source",
        sourceRelativePath: "source.md",
        slug: "source",
        routePath: "/source",
        label: "Source",
        created: "2026-02-27",
        updated: "2026-02-27",
        aliases: ["Start"],
        published: true,
      },
      {
        id: "target-two.md",
        kind: "note",
        relativePath: "target-two.md",
        permalink: "/target-two",
        sourceRelativePath: "target-two.md",
        slug: "target-two",
        routePath: "/target-two",
        label: "Target Two",
        created: "2026-02-27",
        updated: "2026-02-27",
        aliases: ["Launch Target"],
        published: true,
      },
    ],
    edges: [
      {
        sourceNodeId: "source.md",
        targetNodeId: "nested/target.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[nested/target]]",
        target: "nested/target",
        resolutionStrategy: "path",
      },
      {
        sourceNodeId: "source.md",
        targetNodeId: "target-two.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[Launch Target]]",
        target: "Launch Target",
        resolutionStrategy: "alias",
      },
      {
        sourceNodeId: "source.md",
        targetNodeId: "target-two.md",
        sourceRelativePath: "source.md",
        rawWikilink: "[[target-two]]",
        target: "target-two",
        resolutionStrategy: "path",
      },
    ],
    diagnostics: [],
    indexes: {
      nodesById: {
        "nested/target.md": {
          id: "nested/target.md",
          kind: "note",
          relativePath: "nested/target.md",
          permalink: "/nested-target",
          sourceRelativePath: "nested/target.md",
          slug: "nested-target",
          routePath: "/nested-target",
          label: "Nested Target",
          created: "2026-02-27",
          updated: "2026-02-27",
          aliases: [],
          published: true,
        },
        "source.md": {
          id: "source.md",
          kind: "note",
          relativePath: "source.md",
          permalink: "/source",
          sourceRelativePath: "source.md",
          slug: "source",
          routePath: "/source",
          label: "Source",
          created: "2026-02-27",
          updated: "2026-02-27",
          aliases: ["Start"],
          published: true,
        },
        "target-two.md": {
          id: "target-two.md",
          kind: "note",
          relativePath: "target-two.md",
          permalink: "/target-two",
          sourceRelativePath: "target-two.md",
          slug: "target-two",
          routePath: "/target-two",
          label: "Target Two",
          created: "2026-02-27",
          updated: "2026-02-27",
          aliases: ["Launch Target"],
          published: true,
        },
      },
      edgesBySourceNodeId: {
        "source.md": [
          {
            sourceNodeId: "source.md",
            targetNodeId: "nested/target.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[nested/target]]",
            target: "nested/target",
            resolutionStrategy: "path",
          },
          {
            sourceNodeId: "source.md",
            targetNodeId: "target-two.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[Launch Target]]",
            target: "Launch Target",
            resolutionStrategy: "alias",
          },
          {
            sourceNodeId: "source.md",
            targetNodeId: "target-two.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[target-two]]",
            target: "target-two",
            resolutionStrategy: "path",
          },
        ],
      },
      edgesByTargetNodeId: {
        "nested/target.md": [
          {
            sourceNodeId: "source.md",
            targetNodeId: "nested/target.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[nested/target]]",
            target: "nested/target",
            resolutionStrategy: "path",
          },
        ],
        "target-two.md": [
          {
            sourceNodeId: "source.md",
            targetNodeId: "target-two.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[Launch Target]]",
            target: "Launch Target",
            resolutionStrategy: "alias",
          },
          {
            sourceNodeId: "source.md",
            targetNodeId: "target-two.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[target-two]]",
            target: "target-two",
            resolutionStrategy: "path",
          },
        ],
      },
      noteNodeIdBySlug: {
        "nested-target": "nested/target.md",
        source: "source.md",
        "target-two": "target-two.md",
      },
      noteNodeIdByRoutePath: {
        "/nested-target": "nested/target.md",
        "/source": "source.md",
        "/target-two": "target-two.md",
      },
    },
  })

  expect(decodeGraphSnapshot(snapshot)).toEqual(snapshot)
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
  expect(currentSnapshot).toBe(
    `{\n  "schemaVersion": "2",\n  "nodes": [],\n  "edges": [],\n  "diagnostics": [],\n  "indexes": {\n    "nodesById": {},\n    "edgesBySourceNodeId": {},\n    "edgesByTargetNodeId": {},\n    "noteNodeIdBySlug": {},\n    "noteNodeIdByRoutePath": {}\n  }\n}\n`,
  )
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

test("fails fast on invalid to directory before frontmatter validation", async () => {
  const from = await makeTempDirectory()
  const toRoot = await makeTempDirectory()
  const toFile = join(toRoot, "not-a-directory.txt")

  await writeFile(toFile, "hello")
  await writeFile(
    join(from, "invalid.md"),
    `---\ncreated: 2026-02-27\nupdated: 2026-02-27\n---\n# invalid\n`,
  )

  const result = await Effect.runPromiseExit(runWithArgs([from, toFile]))
  expect(Exit.isFailure(result)).toBeTrue()

  if (!Exit.isFailure(result)) {
    throw new Error("Expected CLI execution to fail")
  }

  const firstError = Option.getOrThrow(Result.getSuccess(Exit.findError(result)))
  expect(firstError).toBeInstanceOf(BuildGraphCliValidationError)
  if (!(firstError instanceof BuildGraphCliValidationError)) {
    throw new Error("Expected BuildGraphCliValidationError")
  }
  expect(firstError.message).toContain("Invalid to directory")

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
    schemaVersion: "2",
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
        sourceRelativePath: "source.md",
        slug: "source",
        routePath: "/source",
        label: "Source",
        created: "2026-02-27",
        updated: "2026-02-27",
        aliases: [],
        published: true,
      },
      {
        id: "target.md",
        kind: "note",
        relativePath: "target.md",
        permalink: "/target",
        sourceRelativePath: "target.md",
        slug: "target",
        routePath: "/target",
        label: "Target",
        created: "2026-02-27",
        updated: "2026-02-27",
        aliases: [],
        published: true,
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
    indexes: {
      nodesById: {
        "placeholder:missing/note": {
          id: "placeholder:missing/note",
          kind: "placeholder",
          unresolvedTarget: "missing/note",
        },
        "source.md": {
          id: "source.md",
          kind: "note",
          relativePath: "source.md",
          permalink: "/source",
          sourceRelativePath: "source.md",
          slug: "source",
          routePath: "/source",
          label: "Source",
          created: "2026-02-27",
          updated: "2026-02-27",
          aliases: [],
          published: true,
        },
        "target.md": {
          id: "target.md",
          kind: "note",
          relativePath: "target.md",
          permalink: "/target",
          sourceRelativePath: "target.md",
          slug: "target",
          routePath: "/target",
          label: "Target",
          created: "2026-02-27",
          updated: "2026-02-27",
          aliases: [],
          published: true,
        },
      },
      edgesBySourceNodeId: {
        "source.md": [
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
      },
      edgesByTargetNodeId: {
        "placeholder:missing/note": [
          {
            sourceNodeId: "source.md",
            targetNodeId: "placeholder:missing/note",
            sourceRelativePath: "source.md",
            rawWikilink: "[[missing/note]]",
            target: "missing/note",
            resolutionStrategy: "unresolved",
          },
        ],
        "target.md": [
          {
            sourceNodeId: "source.md",
            targetNodeId: "target.md",
            sourceRelativePath: "source.md",
            rawWikilink: "[[target]]",
            target: "target",
            resolutionStrategy: "path",
          },
        ],
      },
      noteNodeIdBySlug: {
        source: "source.md",
        target: "target.md",
      },
      noteNodeIdByRoutePath: {
        "/source": "source.md",
        "/target": "target.md",
      },
    },
  })

  expect(decodeGraphSnapshot(snapshot)).toEqual(snapshot)
})
