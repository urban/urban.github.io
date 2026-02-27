import { NodeServices } from "@effect/platform-node"
import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Effect } from "effect"
import { discoverMarkdownFiles } from "../src/core/discover"

const tempDirectories = new Set<string>()

const makeTempDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-graph-discover-"))
  tempDirectories.add(directory)
  return directory
}

afterEach(async () => {
  for (const directory of tempDirectories) {
    await rm(directory, { recursive: true, force: true })
  }
  tempDirectories.clear()
})

test("discovers markdown files recursively with stable normalized sorting", async () => {
  const from = await makeTempDirectory()

  await mkdir(join(from, "z"), { recursive: true })
  await mkdir(join(from, "a", "deep"), { recursive: true })
  await writeFile(join(from, "z", "z-note.md"), "# z")
  await writeFile(join(from, "a", "deep", "b-note.md"), "# b")
  await writeFile(join(from, "a", "a-note.MD"), "# a")
  await writeFile(join(from, "a", "ignore.txt"), "ignore me")
  await writeFile(join(from, "root.md"), "# root")

  const discovered = await Effect.runPromise(
    discoverMarkdownFiles(from).pipe(Effect.provide(NodeServices.layer)),
  )

  expect(discovered.map((file) => file.relativePath)).toEqual([
    "a/a-note.MD",
    "a/deep/b-note.md",
    "root.md",
    "z/z-note.md",
  ])
})
