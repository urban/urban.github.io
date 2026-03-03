import { createLocalArtifactFixture } from "./local-artifact-fixture"
import { pathToFileURL } from "node:url"

type SmokeState = {
  readonly appChildCount: number
  readonly appChildTagNames: readonly string[]
  readonly canvasCount: number
  readonly externalDomUrlCount: number
  readonly externalResourceCount: number
  readonly hasRuntimeState: boolean
  readonly graphCanvasCount: number
  readonly graphCanvasIsAppOnlyChild: boolean
  readonly renderedPixelCount: number
  readonly sceneEdgeCount: number
  readonly sceneNodeCount: number
  readonly url: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const parseSessionId = (): number => {
  const raw = process.env.PLAYWRITER_SESSION_ID
  if (raw === undefined) {
    throw new Error("Missing PLAYWRITER_SESSION_ID. Run: bunx playwriter@latest session new")
  }
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid PLAYWRITER_SESSION_ID: ${raw}`)
  }
  return parsed
}

const runPlaywriter = async (sessionId: number, script: string): Promise<string> => {
  const proc = Bun.spawn(["bunx", "playwriter@latest", "-s", String(sessionId), "-e", script], {
    cwd: process.cwd(),
    stderr: "pipe",
    stdout: "pipe",
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  if (exitCode !== 0) {
    throw new Error(`playwriter failed (${exitCode})\n${stderr.trim()}`)
  }

  return stdout
}

const readState = (output: string): SmokeState => {
  const line = output
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value.startsWith("SMOKE_STATE "))

  if (line === undefined) {
    throw new Error("Missing SMOKE_STATE marker in playwriter output")
  }

  const json = line.slice("SMOKE_STATE ".length)
  const parsed: unknown = JSON.parse(json)
  if (!isRecord(parsed)) {
    throw new Error("Invalid SMOKE_STATE payload")
  }
  const record = parsed

  const getNumber = (
    key: keyof Omit<
      SmokeState,
      "url" | "hasRuntimeState" | "appChildTagNames" | "graphCanvasIsAppOnlyChild"
    >,
  ): number => {
    const value = record[key]
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Invalid numeric field: ${key}`)
    }
    return value
  }

  const appChildTagNamesValue = record.appChildTagNames
  if (
    !Array.isArray(appChildTagNamesValue) ||
    appChildTagNamesValue.some((value) => typeof value !== "string")
  ) {
    throw new Error("Invalid appChildTagNames field")
  }

  const urlValue = record.url
  if (typeof urlValue !== "string") {
    throw new Error("Invalid url field")
  }

  const hasRuntimeStateValue = record.hasRuntimeState
  if (typeof hasRuntimeStateValue !== "boolean") {
    throw new Error("Invalid hasRuntimeState field")
  }

  const graphCanvasIsAppOnlyChildValue = record.graphCanvasIsAppOnlyChild
  if (typeof graphCanvasIsAppOnlyChildValue !== "boolean") {
    throw new Error("Invalid graphCanvasIsAppOnlyChild field")
  }

  return {
    appChildCount: getNumber("appChildCount"),
    appChildTagNames: appChildTagNamesValue,
    canvasCount: getNumber("canvasCount"),
    externalDomUrlCount: getNumber("externalDomUrlCount"),
    externalResourceCount: getNumber("externalResourceCount"),
    hasRuntimeState: hasRuntimeStateValue,
    graphCanvasCount: getNumber("graphCanvasCount"),
    graphCanvasIsAppOnlyChild: graphCanvasIsAppOnlyChildValue,
    renderedPixelCount: getNumber("renderedPixelCount"),
    sceneEdgeCount: getNumber("sceneEdgeCount"),
    sceneNodeCount: getNumber("sceneNodeCount"),
    url: urlValue,
  }
}

const assertSmokeState = (state: SmokeState): void => {
  if (!state.url.startsWith("file://")) {
    throw new Error(`Expected file:// url, got: ${state.url}`)
  }
  if (state.canvasCount !== 1) {
    throw new Error(`Expected single canvas, got: ${state.canvasCount}`)
  }
  if (state.graphCanvasCount !== 1) {
    throw new Error(`Expected exactly one #graph-canvas, got: ${state.graphCanvasCount}`)
  }
  if (state.appChildCount !== 1) {
    throw new Error(`Expected single graph root child in #app, got: ${state.appChildCount}`)
  }
  if (!state.graphCanvasIsAppOnlyChild) {
    throw new Error(
      `Expected #graph-canvas as only #app child, got: [${state.appChildTagNames.join(", ")}]`,
    )
  }
  if (state.externalDomUrlCount !== 0) {
    throw new Error(`Expected no external src/href URLs in DOM, got: ${state.externalDomUrlCount}`)
  }
  if (state.externalResourceCount !== 0) {
    throw new Error(`Expected no external network resources, got: ${state.externalResourceCount}`)
  }
  if (state.sceneNodeCount < 2) {
    throw new Error(`Expected rendered scene nodes, got: ${state.sceneNodeCount}`)
  }
  if (state.sceneEdgeCount < 1) {
    throw new Error(`Expected rendered scene edges, got: ${state.sceneEdgeCount}`)
  }
  if (!state.hasRuntimeState) {
    throw new Error("Expected window.__graphVisualizerState to exist")
  }
  if (state.renderedPixelCount === 0) {
    throw new Error("Expected non-empty canvas pixels")
  }
}

const main = async (): Promise<void> => {
  const sessionId = parseSessionId()
  const fixture = createLocalArtifactFixture()
  try {
    const artifactUrl = pathToFileURL(fixture.htmlPath).href
    const smokeScript = `
state.page = context.pages().find((p) => p.url() === "about:blank") ?? (await context.newPage());
await state.page.setViewportSize({ width: 1280, height: 900 });
await state.page.goto(${JSON.stringify(artifactUrl)}, { waitUntil: "domcontentloaded" });
await state.page.waitForLoadState("domcontentloaded");
await state.page.waitForTimeout(50);
const smokeState = await state.page.evaluate(() => {
  const app = document.getElementById("app");
  const canvas = document.getElementById("graph-canvas");
  const sceneElement = document.getElementById("graph-scene");
  const canvasCount = document.querySelectorAll("canvas").length;
  const graphCanvasCount = document.querySelectorAll("#graph-canvas").length;
  const appChildCount = app instanceof HTMLElement ? app.childElementCount : 0;
  const appChildTagNames = app instanceof HTMLElement ? Array.from(app.children).map((element) => element.tagName.toLowerCase()) : [];
  const graphCanvasIsAppOnlyChild = app instanceof HTMLElement
    && app.childElementCount === 1
    && app.firstElementChild instanceof HTMLCanvasElement
    && app.firstElementChild.id === "graph-canvas";
  const scene = sceneElement instanceof HTMLScriptElement ? JSON.parse(sceneElement.textContent ?? "{}") : { nodes: [], edges: [] };
  const sceneNodeCount = Array.isArray(scene.nodes) ? scene.nodes.length : 0;
  const sceneEdgeCount = Array.isArray(scene.edges) ? scene.edges.length : 0;
  const externalDomUrlCount = Array.from(document.querySelectorAll("[src], [href]"))
    .map((element) => {
      if (element instanceof HTMLScriptElement && typeof element.src === "string" && element.src.length > 0) {
        return element.src;
      }
      if (element instanceof HTMLLinkElement && typeof element.href === "string" && element.href.length > 0) {
        return element.href;
      }
      if (element instanceof HTMLImageElement && typeof element.src === "string" && element.src.length > 0) {
        return element.src;
      }
      if (element instanceof HTMLAnchorElement && typeof element.href === "string" && element.href.length > 0) {
        return element.href;
      }
      return "";
    })
    .filter((value) => /^https?:\\/\\//i.test(value) || /^\\/\\//.test(value))
    .length;
  const externalResourceCount = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => /^https?:\\/\\//i.test(name) || /^\\/\\//.test(name))
    .length;
  let renderedPixelCount = 0;
  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (ctx !== null) {
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < image.length; i += 4) {
        if (image[i] !== 0) {
          renderedPixelCount += 1;
        }
      }
    }
  }
  return {
    appChildCount,
    appChildTagNames,
    canvasCount,
    externalDomUrlCount,
    externalResourceCount,
    hasRuntimeState: typeof window.__graphVisualizerState === "object" && window.__graphVisualizerState !== null,
    graphCanvasCount,
    graphCanvasIsAppOnlyChild,
    renderedPixelCount,
    sceneEdgeCount,
    sceneNodeCount,
    url: window.location.href,
  };
});
console.log("SMOKE_STATE " + JSON.stringify(smokeState));
`

    const output = await runPlaywriter(sessionId, smokeScript)
    const smokeState = readState(output)
    assertSmokeState(smokeState)
    console.log("Playwriter smoke passed", smokeState)
  } finally {
    fixture.cleanup()
  }
}

await main()
