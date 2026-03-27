import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.pw\.ts/,
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      scale: "device",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 900, height: 700 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "bunx vite --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/playwright-harness.html",
    reuseExistingServer: false,
    cwd: ".",
  },
})
