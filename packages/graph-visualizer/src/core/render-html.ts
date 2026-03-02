import { Effect } from "effect"
import { buildGraphRenderModel, type GraphRenderModel } from "./model"

const escapeScriptPayload = (value: string): string =>
  value.replaceAll("&", "\\u0026").replaceAll("<", "\\u003c").replaceAll(">", "\\u003e")

export const renderHtmlFromModel = (model: GraphRenderModel): string => {
  const payload = escapeScriptPayload(JSON.stringify(model))

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width,initial-scale=1" />',
    "  <title>Graph Visualizer</title>",
    "  <style>",
    "    html, body { margin: 0; width: 100%; height: 100%; background: #0f172a; color: #e2e8f0; }",
    "    #app { width: 100%; height: 100%; display: grid; place-items: center; }",
    "    #graph-canvas { width: min(96vw, 1200px); height: min(92vh, 900px); border: 1px solid #1e293b; background: #020617; }",
    "  </style>",
    "</head>",
    "<body>",
    '  <div id="app">',
    '    <canvas id="graph-canvas" width="1200" height="900" aria-label="Graph visualization canvas"></canvas>',
    "  </div>",
    `  <script id="graph-snapshot" type="application/json">${payload}</script>`,
    "  <script>",
    "    const payloadElement = document.getElementById('graph-snapshot');",
    "    const canvas = document.getElementById('graph-canvas');",
    "    if (payloadElement instanceof HTMLScriptElement && canvas instanceof HTMLCanvasElement) {",
    "      const context = canvas.getContext('2d');",
    "      const snapshot = JSON.parse(payloadElement.textContent ?? '{}');",
    "      if (context !== null) {",
    "        context.clearRect(0, 0, canvas.width, canvas.height);",
    "        context.fillStyle = '#e2e8f0';",
    "        context.font = '16px ui-monospace, SFMono-Regular, Menlo, monospace';",
    "        context.fillText(`nodes: ${snapshot.nodes?.length ?? 0}`, 24, 42);",
    "        context.fillText(`edges: ${snapshot.edges?.length ?? 0}`, 24, 70);",
    "      }",
    "    }",
    "  </script>",
    "</body>",
    "</html>",
    "",
  ].join("\n")
}

export const renderHtmlFromSnapshot = (
  snapshot: Parameters<typeof buildGraphRenderModel>[0],
): string => renderHtmlFromModel(Effect.runSync(buildGraphRenderModel(snapshot)))
