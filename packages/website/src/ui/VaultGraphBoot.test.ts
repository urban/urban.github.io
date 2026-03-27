import { describe, expect, test } from "bun:test"
import { resolveVaultGraphSelectionNavigationHref } from "./VaultGraphBoot"

describe("resolveVaultGraphSelectionNavigationHref", () => {
  test("navigates to a selected note route path", () => {
    expect(
      resolveVaultGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/vault/target",
          displayLabel: "Target",
          relativePath: "Target.md",
          permalink: "/target",
          routePath: "/vault/target",
          aliases: [],
        },
        pathname: "/vault/source",
      }),
    ).toBe("/vault/target")
  })

  test("does not navigate when the selected note already matches the current pathname", () => {
    expect(
      resolveVaultGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/vault/target",
          displayLabel: "Target",
          relativePath: "Target.md",
          permalink: "/target",
          routePath: "/vault/target/",
          aliases: [],
        },
        pathname: "/vault/target",
      }),
    ).toBeNull()
  })

  test("falls back to the permalink when routePath is unavailable", () => {
    expect(
      resolveVaultGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/vault/target",
          displayLabel: "Target",
          relativePath: "Target.md",
          permalink: "/target",
          aliases: [],
        },
        pathname: "/vault/source",
      }),
    ).toBe("/target")
  })

  test("ignores placeholder selections", () => {
    expect(
      resolveVaultGraphSelectionNavigationHref({
        selection: {
          type: "placeholder",
          nodeId: "placeholder:ghost",
          displayLabel: "Ghost",
          unresolvedTarget: "ghost",
        },
        pathname: "/vault/source",
      }),
    ).toBeNull()
  })
})
