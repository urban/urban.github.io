import { describe, expect, test } from "bun:test"
import { resolveGraphSelectionNavigationHref } from "./GraphBoot"

describe("resolveGraphSelectionNavigationHref", () => {
  test("navigates to a selected note route path", () => {
    expect(
      resolveGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/garden/target",
          displayLabel: "Target",
          relativePath: "Target.md",
          permalink: "/target",
          routePath: "/garden/target",
          aliases: [],
        },
        pathname: "/garden/source",
      }),
    ).toBe("/garden/target")
  })

  test("does not navigate when the selected note already matches the current pathname", () => {
    expect(
      resolveGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/garden/target",
          displayLabel: "Target",
          relativePath: "Target.md",
          permalink: "/target",
          routePath: "/garden/target/",
          aliases: [],
        },
        pathname: "/garden/target",
      }),
    ).toBeNull()
  })

  test("uses the shared garden route helper for the index slug", () => {
    expect(
      resolveGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/garden/index",
          displayLabel: "The Garden",
          relativePath: "index.md",
          permalink: "index",
          routePath: "/garden/index",
          slug: "index",
          aliases: [],
        },
        pathname: "/garden/source",
      }),
    ).toBe("/garden")
  })

  test("falls back to the permalink when routePath is unavailable", () => {
    expect(
      resolveGraphSelectionNavigationHref({
        selection: {
          type: "note",
          nodeId: "/garden/target",
          displayLabel: "Target",
          relativePath: "Target.md",
          permalink: "/target",
          aliases: [],
        },
        pathname: "/garden/source",
      }),
    ).toBe("/target")
  })

  test("ignores placeholder selections", () => {
    expect(
      resolveGraphSelectionNavigationHref({
        selection: {
          type: "placeholder",
          nodeId: "placeholder:ghost",
          displayLabel: "Ghost",
          unresolvedTarget: "ghost",
        },
        pathname: "/garden/source",
      }),
    ).toBeNull()
  })
})
