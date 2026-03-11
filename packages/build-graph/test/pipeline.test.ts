import { NodeServices } from "@effect/platform-node"
import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect } from "effect"
import {
  buildGraphSnapshotFromMarkdownSources,
  buildGraphSnapshotFromRoot,
} from "../src/core/pipeline"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-graph-pipeline-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("builds canonical-route snapshots from markdown sources", async () => {
  const result = await Effect.runPromise(
    buildGraphSnapshotFromMarkdownSources(
      [
        {
          relativePath: "Harness Loop.md",
          source: [
            "---",
            "title: Harness Loop",
            "permalink: harness-loop",
            "created: 2026-02-01",
            "updated: 2026-02-02",
            "---",
            "[[tool-adapter-contract]]",
            "",
          ].join("\n"),
        },
        {
          relativePath: "Tool Adapter Contract.md",
          source: [
            "---",
            "title: Tool Adapter Contract",
            "permalink: tool-adapter-contract",
            "created: 2026-02-03",
            "updated: 2026-02-04",
            "---",
            "# target",
            "",
          ].join("\n"),
        },
      ],
      { identityStrategy: "canonical-route", routePrefix: "/vault" },
    ),
  )

  expect(result.snapshot.indexes.noteNodeIdBySlug ?? {}).toEqual({
    "harness-loop": "/vault/harness-loop",
    "tool-adapter-contract": "/vault/tool-adapter-contract",
  })
  expect(result.snapshot.indexes.noteNodeIdByRoutePath ?? {}).toEqual({
    "/vault/harness-loop": "/vault/harness-loop",
    "/vault/tool-adapter-contract": "/vault/tool-adapter-contract",
  })
  expect(
    result.snapshot.nodes.find((node) => node.kind === "note" && node.slug === "harness-loop"),
  ).toEqual(
    expect.objectContaining({
      id: "/vault/harness-loop",
      relativePath: "Harness Loop.md",
      sourceRelativePath: "Harness Loop.md",
      routePath: "/vault/harness-loop",
      label: "Harness Loop",
    }),
  )
})

test("builds canonical-route snapshots from a filesystem root", async () => {
  const root = await makeTempDirectory()
  const notePath = join(root, "Harness Loop.md")
  await writeFile(
    notePath,
    [
      "---",
      "title: Harness Loop",
      "permalink: harness-loop",
      "created: 2026-02-01",
      "updated: 2026-02-02",
      "---",
      "# note",
      "",
    ].join("\n"),
  )

  const source = await readFile(notePath, "utf8")
  expect(source).toContain("Harness Loop")

  const result = await Effect.runPromise(
    buildGraphSnapshotFromRoot(root, {
      identityStrategy: "canonical-route",
      routePrefix: "vault",
    }).pipe(Effect.provide(NodeServices.layer)),
  )

  expect(result.snapshot.indexes.noteNodeIdBySlug?.["harness-loop"]).toBe("/vault/harness-loop")
})
