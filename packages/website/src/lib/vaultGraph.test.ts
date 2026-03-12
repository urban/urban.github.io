import { expect, test } from "bun:test"
import { getVaultGraphModel, resolveSelectedVaultNodeId } from "./vaultGraph"

test("resolves canonical selected node ids for vault slugs with spaced source filenames", async () => {
  const { snapshot } = await getVaultGraphModel()

  expect(resolveSelectedVaultNodeId(snapshot, "harness-loop")).toBe("/vault/harness-loop")
  expect(resolveSelectedVaultNodeId(snapshot, "effect-runtime-boundary")).toBe(
    "/vault/effect-runtime-boundary",
  )
})

test("fails fast when a published vault slug has no node mapping", async () => {
  const { snapshot } = await getVaultGraphModel()

  expect(() => resolveSelectedVaultNodeId(snapshot, "missing-slug")).toThrow(
    "Missing vault graph node id for slug: missing-slug",
  )
})
