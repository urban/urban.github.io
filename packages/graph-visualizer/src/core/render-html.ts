import { Effect } from "effect"
import { buildGraphRenderModel, type GraphRenderModel } from "./model"

const escapeScriptPayload = (value: string): string =>
  value.replaceAll("&", "\\u0026").replaceAll("<", "\\u003c").replaceAll(">", "\\u003e")

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 900
const NODE_RADIUS = 16

type GraphSceneNode = {
  readonly id: string
  readonly kind: "note" | "placeholder"
  readonly label: string
  readonly x: number
  readonly y: number
  readonly radius: number
}

type GraphSceneEdge = {
  readonly id: string
  readonly sourceNodeId: string
  readonly targetNodeId: string
  readonly sourceX: number
  readonly sourceY: number
  readonly targetX: number
  readonly targetY: number
}

type GraphScene = {
  readonly nodes: ReadonlyArray<GraphSceneNode>
  readonly edges: ReadonlyArray<GraphSceneEdge>
}

const roundCoordinate = (value: number): number => Number(value.toFixed(3))

const deriveCircularLayout = (
  nodeIds: ReadonlyArray<string>,
): Readonly<Record<string, { readonly x: number; readonly y: number }>> => {
  const centerX = CANVAS_WIDTH / 2
  const centerY = CANVAS_HEIGHT / 2
  const radius = Math.max(120, Math.min(300, Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.34))

  if (nodeIds.length === 0) {
    return {}
  }

  if (nodeIds.length === 1) {
    return {
      [nodeIds[0]]: {
        x: centerX,
        y: centerY,
      },
    }
  }

  const positions: Record<string, { readonly x: number; readonly y: number }> = {}
  const step = (Math.PI * 2) / nodeIds.length
  for (const [index, nodeId] of nodeIds.entries()) {
    const angle = -Math.PI / 2 + step * index
    positions[nodeId] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  }
  return positions
}

const deriveScene = (model: GraphRenderModel): GraphScene => {
  const sortedNodes = [...model.nodes].sort((left, right) => left.id.localeCompare(right.id))
  const sortedEdges = [...model.edges].sort((left, right) => {
    const sourceOrder = left.sourceNodeId.localeCompare(right.sourceNodeId)
    if (sourceOrder !== 0) {
      return sourceOrder
    }
    return left.targetNodeId.localeCompare(right.targetNodeId)
  })

  const positionsById = deriveCircularLayout(sortedNodes.map((node) => node.id))

  const sceneNodes: ReadonlyArray<GraphSceneNode> = sortedNodes.map((node) => {
    const coordinates = positionsById[node.id]
    return {
      id: node.id,
      kind: node.kind,
      label: node.label,
      x: roundCoordinate(coordinates.x),
      y: roundCoordinate(coordinates.y),
      radius: NODE_RADIUS,
    }
  })

  const sceneEdges: ReadonlyArray<GraphSceneEdge> = sortedEdges.flatMap((edge) => {
    const sourceCoordinates = positionsById[edge.sourceNodeId]
    const targetCoordinates = positionsById[edge.targetNodeId]
    if (sourceCoordinates === undefined || targetCoordinates === undefined) {
      return []
    }

    return [
      {
        id: `${edge.sourceNodeId}=>${edge.targetNodeId}`,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceX: roundCoordinate(sourceCoordinates.x),
        sourceY: roundCoordinate(sourceCoordinates.y),
        targetX: roundCoordinate(targetCoordinates.x),
        targetY: roundCoordinate(targetCoordinates.y),
      },
    ]
  })

  return {
    nodes: sceneNodes,
    edges: sceneEdges,
  }
}

export const renderHtmlFromModel = (model: GraphRenderModel): string => {
  const payload = escapeScriptPayload(JSON.stringify(model))
  const scenePayload = escapeScriptPayload(JSON.stringify(deriveScene(model)))

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
    `  <script id="graph-scene" type="application/json">${scenePayload}</script>`,
    "  <script>",
    "    const sceneElement = document.getElementById('graph-scene');",
    "    const canvas = document.getElementById('graph-canvas');",
    "    if (sceneElement instanceof HTMLScriptElement && canvas instanceof HTMLCanvasElement) {",
    "      const context = canvas.getContext('2d');",
    "      const scene = JSON.parse(sceneElement.textContent ?? '{}');",
    "      if (context !== null) {",
    "        context.clearRect(0, 0, canvas.width, canvas.height);",
    "        context.strokeStyle = '#334155';",
    "        context.lineWidth = 1.5;",
    "        for (const edge of scene.edges ?? []) {",
    "          context.beginPath();",
    "          context.moveTo(edge.sourceX, edge.sourceY);",
    "          context.lineTo(edge.targetX, edge.targetY);",
    "          context.stroke();",
    "        }",
    "        const NOTE_FILL = '#38bdf8';",
    "        const PLACEHOLDER_FILL = '#fb923c';",
    "        context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';",
    "        context.textAlign = 'center';",
    "        context.textBaseline = 'middle';",
    "        for (const node of scene.nodes ?? []) {",
    "          context.beginPath();",
    "          context.fillStyle = node.kind === 'placeholder' ? PLACEHOLDER_FILL : NOTE_FILL;",
    "          context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);",
    "          context.fill();",
    "          context.lineWidth = 1;",
    "          context.strokeStyle = '#0f172a';",
    "          context.stroke();",
    "          context.fillStyle = '#e2e8f0';",
    "          context.fillText(node.label, node.x, node.y - node.radius - 12);",
    "        }",
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
