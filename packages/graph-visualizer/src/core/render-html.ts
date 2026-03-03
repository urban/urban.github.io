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
    "        const sceneNodes = Array.isArray(scene.nodes) ? scene.nodes : [];",
    "        const sceneEdges = Array.isArray(scene.edges) ? scene.edges : [];",
    "        const HIT_TEST_PADDING = 6;",
    "        const NOTE_FILL = '#38bdf8';",
    "        const PLACEHOLDER_FILL = '#fb923c';",
    "        const NODE_MUTED_FILL = 'rgba(148, 163, 184, 0.35)';",
    "        const LABEL_FILL = '#e2e8f0';",
    "        const LABEL_MUTED_FILL = 'rgba(148, 163, 184, 0.55)';",
    "        const EDGE_BASE_STROKE = '#334155';",
    "        const EDGE_HIGHLIGHT_STROKE = '#38bdf8';",
    "        const EDGE_MUTED_STROKE = 'rgba(71, 85, 105, 0.32)';",
    "        const HOVER_RING_STROKE = '#f8fafc';",
    "        const nodeById = new Map(sceneNodes.map((node) => [node.id, node]));",
    "        const sortedNodeIds = sceneNodes.map((node) => node.id).slice().sort((left, right) => left.localeCompare(right));",
    "        const sortedEdgeIds = sceneEdges.map((edge) => edge.id).slice().sort((left, right) => left.localeCompare(right));",
    "        const adjacencyByNodeId = new Map();",
    "        for (const nodeId of sortedNodeIds) {",
    "          adjacencyByNodeId.set(nodeId, []);",
    "        }",
    "        for (const edge of sceneEdges) {",
    "          const sourceNeighbors = adjacencyByNodeId.get(edge.sourceNodeId);",
    "          if (Array.isArray(sourceNeighbors) && !sourceNeighbors.includes(edge.targetNodeId)) {",
    "            sourceNeighbors.push(edge.targetNodeId);",
    "          }",
    "          const targetNeighbors = adjacencyByNodeId.get(edge.targetNodeId);",
    "          if (Array.isArray(targetNeighbors) && !targetNeighbors.includes(edge.sourceNodeId)) {",
    "            targetNeighbors.push(edge.sourceNodeId);",
    "          }",
    "        }",
    "        for (const [nodeId, neighbors] of adjacencyByNodeId.entries()) {",
    "          neighbors.sort((left, right) => left.localeCompare(right));",
    "          adjacencyByNodeId.set(nodeId, neighbors);",
    "        }",
    "        const edgeById = new Map(sceneEdges.map((edge) => [edge.id, edge]));",
    "        let pointerNodeId = null;",
    "        const readSnapshot = () => {",
    "          const hoveredNodeId = pointerNodeId !== null && nodeById.has(pointerNodeId) ? pointerNodeId : null;",
    "          if (hoveredNodeId === null) {",
    "            return {",
    "              pointerNodeId,",
    "              hoveredNodeId,",
    "              highlightedNodeIds: [],",
    "              highlightedEdgeIds: [],",
    "              mutedNodeIds: [],",
    "              mutedEdgeIds: [],",
    "            };",
    "          }",
    "          const highlightedNodeIds = [hoveredNodeId, ...(adjacencyByNodeId.get(hoveredNodeId) ?? [])]",
    "            .slice()",
    "            .sort((left, right) => left.localeCompare(right));",
    "          const highlightedNodeIdSet = new Set(highlightedNodeIds);",
    "          const highlightedEdgeIds = sortedEdgeIds.filter((edgeId) => {",
    "            const edge = edgeById.get(edgeId);",
    "            return edge !== undefined && (edge.sourceNodeId === hoveredNodeId || edge.targetNodeId === hoveredNodeId);",
    "          });",
    "          const highlightedEdgeIdSet = new Set(highlightedEdgeIds);",
    "          return {",
    "            pointerNodeId,",
    "            hoveredNodeId,",
    "            highlightedNodeIds,",
    "            highlightedEdgeIds,",
    "            mutedNodeIds: sortedNodeIds.filter((nodeId) => !highlightedNodeIdSet.has(nodeId)),",
    "            mutedEdgeIds: sortedEdgeIds.filter((edgeId) => !highlightedEdgeIdSet.has(edgeId)),",
    "          };",
    "        };",
    "        const toCanvasCoordinates = (event) => {",
    "          const rect = canvas.getBoundingClientRect();",
    "          if (rect.width === 0 || rect.height === 0) {",
    "            return { x: -1, y: -1 };",
    "          }",
    "          const scaleX = canvas.width / rect.width;",
    "          const scaleY = canvas.height / rect.height;",
    "          return {",
    "            x: (event.clientX - rect.left) * scaleX,",
    "            y: (event.clientY - rect.top) * scaleY,",
    "          };",
    "        };",
    "        const pickPointerNodeId = (x, y) => {",
    "          let candidateNode = null;",
    "          let candidateDistanceSquared = Number.POSITIVE_INFINITY;",
    "          for (const node of sceneNodes) {",
    "            const dx = x - node.x;",
    "            const dy = y - node.y;",
    "            const distanceSquared = dx * dx + dy * dy;",
    "            const limit = node.radius + HIT_TEST_PADDING;",
    "            if (distanceSquared > limit * limit) {",
    "              continue;",
    "            }",
    "            if (distanceSquared < candidateDistanceSquared) {",
    "              candidateNode = node;",
    "              candidateDistanceSquared = distanceSquared;",
    "              continue;",
    "            }",
    "            if (distanceSquared === candidateDistanceSquared && candidateNode !== null && node.id.localeCompare(candidateNode.id) < 0) {",
    "              candidateNode = node;",
    "            }",
    "          }",
    "          return candidateNode === null ? null : candidateNode.id;",
    "        };",
    "        const draw = () => {",
    "          const snapshot = readSnapshot();",
    "          const highlightedNodeIds = new Set(snapshot.highlightedNodeIds);",
    "          const highlightedEdgeIds = new Set(snapshot.highlightedEdgeIds);",
    "          const mutedNodeIds = new Set(snapshot.mutedNodeIds);",
    "          const mutedEdgeIds = new Set(snapshot.mutedEdgeIds);",
    "          context.clearRect(0, 0, canvas.width, canvas.height);",
    "          for (const edge of sceneEdges) {",
    "            const isMuted = mutedEdgeIds.has(edge.id);",
    "            const isHighlighted = highlightedEdgeIds.has(edge.id);",
    "            context.beginPath();",
    "            context.moveTo(edge.sourceX, edge.sourceY);",
    "            context.lineTo(edge.targetX, edge.targetY);",
    "            context.strokeStyle = isMuted ? EDGE_MUTED_STROKE : isHighlighted ? EDGE_HIGHLIGHT_STROKE : EDGE_BASE_STROKE;",
    "            context.lineWidth = isHighlighted ? 2.5 : 1.5;",
    "            context.stroke();",
    "          }",
    "          context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';",
    "          context.textAlign = 'center';",
    "          context.textBaseline = 'middle';",
    "          for (const node of sceneNodes) {",
    "            const isMuted = mutedNodeIds.has(node.id);",
    "            const isHighlighted = highlightedNodeIds.has(node.id);",
    "            const isHovered = snapshot.hoveredNodeId === node.id;",
    "            context.beginPath();",
    "            context.fillStyle = isMuted",
    "              ? NODE_MUTED_FILL",
    "              : node.kind === 'placeholder'",
    "                ? PLACEHOLDER_FILL",
    "                : NOTE_FILL;",
    "            context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);",
    "            context.fill();",
    "            context.lineWidth = isHovered ? 3 : isHighlighted ? 1.75 : 1;",
    "            context.strokeStyle = isHovered ? HOVER_RING_STROKE : '#0f172a';",
    "            context.stroke();",
    "            context.fillStyle = isMuted ? LABEL_MUTED_FILL : LABEL_FILL;",
    "            context.fillText(node.label, node.x, node.y - node.radius - 12);",
    "          }",
    "          window.__graphVisualizerState = {",
    "            snapshot,",
    "            readSnapshot,",
    "          };",
    "        };",
    "        canvas.addEventListener('pointermove', (event) => {",
    "          const point = toCanvasCoordinates(event);",
    "          const nextPointerNodeId = pickPointerNodeId(point.x, point.y);",
    "          if (nextPointerNodeId === pointerNodeId) {",
    "            return;",
    "          }",
    "          pointerNodeId = nextPointerNodeId;",
    "          draw();",
    "        });",
    "        canvas.addEventListener('pointerleave', () => {",
    "          if (pointerNodeId === null) {",
    "            return;",
    "          }",
    "          pointerNodeId = null;",
    "          draw();",
    "        });",
    "        draw();",
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
