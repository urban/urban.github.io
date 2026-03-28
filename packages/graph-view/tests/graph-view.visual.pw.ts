import { expect, test, type Page } from "@playwright/test"

type HarnessTheme = "light" | "dark"

type SelectionChange =
  | { type: "none" }
  | {
      type: "note"
      nodeId: string
      displayLabel: string
      relativePath: string
      permalink: string
      routePath?: string
      aliases: ReadonlyArray<string>
    }
  | { type: "placeholder"; nodeId: string; displayLabel: string; unresolvedTarget: string }

type GraphHarness = {
  settleLayout: (tickCount?: number) => Promise<void>
  setTheme: (theme: HarnessTheme) => Promise<void>
  hoverNode: (nodeId: string | null) => Promise<void>
  selectNode: (nodeId: string) => Promise<void>
  clearSelectionChanges: () => void
  getSelectionChanges: () => ReadonlyArray<SelectionChange>
}

async function gotoHarness(page: Page, harnessPath = "/playwright-harness.html") {
  await page.goto(harnessPath)
  await page.waitForFunction(() => "__graphViewHarness" in window)
  await settleLayout(page)
}

async function settleLayout(page: Page, tickCount = 400) {
  await page.evaluate(async (nextTickCount: number) => {
    const graphWindow = window as typeof window & { __graphViewHarness: GraphHarness }
    await graphWindow.__graphViewHarness.settleLayout(nextTickCount)
  }, tickCount)
}

async function setTheme(page: Page, theme: HarnessTheme) {
  await page.evaluate(async (nextTheme: HarnessTheme) => {
    const graphWindow = window as typeof window & { __graphViewHarness: GraphHarness }
    await graphWindow.__graphViewHarness.setTheme(nextTheme)
  }, theme)
}

async function hoverNode(page: Page, nodeId: string | null) {
  await page.evaluate(async (nextNodeId: string | null) => {
    const graphWindow = window as typeof window & { __graphViewHarness: GraphHarness }
    await graphWindow.__graphViewHarness.hoverNode(nextNodeId)
  }, nodeId)
}

async function selectNode(page: Page, nodeId: string) {
  await page.evaluate(async (nextNodeId: string) => {
    const graphWindow = window as typeof window & { __graphViewHarness: GraphHarness }
    await graphWindow.__graphViewHarness.selectNode(nextNodeId)
  }, nodeId)
}

async function clearSelectionChanges(page: Page) {
  await page.evaluate(() => {
    const graphWindow = window as typeof window & { __graphViewHarness: GraphHarness }
    graphWindow.__graphViewHarness.clearSelectionChanges()
  })
}

async function getSelectionChanges(page: Page) {
  return page.evaluate(() => {
    const graphWindow = window as typeof window & { __graphViewHarness: GraphHarness }
    return graphWindow.__graphViewHarness.getSelectionChanges()
  })
}

test.describe("graph view visual regression", () => {
  test("renders the default selected state in the light theme", async ({ page }) => {
    await gotoHarness(page)

    await expect(page).toHaveScreenshot("graph-light.png", { maxDiffPixels: 3_000 })
  })

  test("renders the default selected state in the dark theme", async ({ page }) => {
    await gotoHarness(page)
    await setTheme(page, "dark")

    await expect(page).toHaveScreenshot("graph-dark.png", { maxDiffPixels: 3_000 })
  })
})

test.describe("graph view custom theme overrides", () => {
  test("renders a custom light theme from HTML data attributes", async ({ page }) => {
    await gotoHarness(page, "/playwright-custom-theme-harness.html")

    await expect(page).toHaveScreenshot("graph-custom-light.png", { maxDiffPixels: 3_000 })
  })

  test("renders a custom dark theme from HTML data attributes", async ({ page }) => {
    await gotoHarness(page, "/playwright-custom-theme-harness.html")
    await setTheme(page, "dark")

    await expect(page).toHaveScreenshot("graph-custom-dark.png", { maxDiffPixels: 3_000 })
  })
})

test.describe("graph view interactions", () => {
  test("shows hover state for the selected node", async ({ page }) => {
    await gotoHarness(page)
    await hoverNode(page, "alpha")

    await expect(page).toHaveScreenshot("graph-selected-node-hover.png", {
      maxDiffPixels: 3_000,
    })
  })

  test("shows hover state for a node that is not the selected node sibling", async ({ page }) => {
    await gotoHarness(page)
    await hoverNode(page, "delta")

    await expect(page).toHaveScreenshot("graph-non-sibling-hover.png", {
      maxDiffPixels: 3_000,
    })
  })

  test("shows selection state for a node that is not the selected node sibling", async ({
    page,
  }) => {
    await gotoHarness(page)
    await clearSelectionChanges(page)
    await selectNode(page, "delta")
    await settleLayout(page)

    await expect(page).toHaveScreenshot("graph-non-sibling-selected.png", {
      maxDiffPixels: 3_000,
    })
  })

  test("reports selected node changes when the selection moves", async ({ page }) => {
    await gotoHarness(page)
    await clearSelectionChanges(page)
    await selectNode(page, "delta")
    await settleLayout(page)

    await expect
      .poll(async () => getSelectionChanges(page))
      .toEqual([
        {
          type: "note",
          nodeId: "delta",
          displayLabel: "Delta",
          relativePath: "delta.md",
          permalink: "/delta/",
          routePath: "/delta",
          aliases: [],
        },
      ])
  })
})
