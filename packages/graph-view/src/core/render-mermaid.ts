import { Graph } from "effect"
import type { GraphSnapshot } from "@urban/build-graph/src/domain/schema"
import { buildRenderModel } from "./render-model"

export const renderMermaidFromSnapshot = (snapshot: GraphSnapshot): string => {
  const renderModel = buildRenderModel(snapshot)
  const graph = Graph.directed<(typeof renderModel.nodes)[number], string>((mutable) => {
    const graphNodeIndices: Array<number> = []

    for (const node of renderModel.nodes) {
      graphNodeIndices.push(Graph.addNode(mutable, node))
    }

    for (const edge of renderModel.edges) {
      const sourceNodeIndex = graphNodeIndices[edge.sourceNodeIndex]
      const targetNodeIndex = graphNodeIndices[edge.targetNodeIndex]
      if (sourceNodeIndex === undefined || targetNodeIndex === undefined) {
        throw new Error("Graph render invariant violation: internal node index mismatch")
      }
      Graph.addEdge(mutable, sourceNodeIndex, targetNodeIndex, "")
    }
  })

  return Graph.toMermaid(graph, {
    diagramType: "graph",
    direction: "LR",
    edgeLabel: () => "",
    nodeLabel: (node) => node.label,
    nodeShape: (node) => (node.kind === "placeholder" ? "hexagon" : "rectangle"),
  })
}
