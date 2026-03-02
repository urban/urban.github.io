import type { GraphSnapshot } from "../domain/schema"
import { buildRenderModel } from "./render-model"

export const renderMermaidFromSnapshot = (snapshot: GraphSnapshot): string => {
  const renderModel = buildRenderModel(snapshot)
  const nodeLines = renderModel.nodes.map(
    (node) => `  ${node.mermaidId}[${JSON.stringify(node.label)}]`,
  )
  const edgeLines = renderModel.edges.map(
    (edge) => `  ${edge.sourceMermaidId} --> ${edge.targetMermaidId}`,
  )
  const placeholderNodes = renderModel.nodes.filter((node) => node.kind === "placeholder")
  const placeholderClassLines = placeholderNodes.map(
    (node) => `  class ${node.mermaidId} unresolved`,
  )
  const hasPlaceholderNodes = placeholderNodes.length > 0

  return [
    "graph LR",
    ...nodeLines,
    ...edgeLines,
    ...(hasPlaceholderNodes
      ? ["  classDef unresolved fill:#fff4e5,stroke:#d97706,color:#7c2d12,stroke-width:1px"]
      : []),
    ...placeholderClassLines,
  ].join("\n")
}
