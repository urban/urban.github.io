import type { GraphSnapshot } from "../domain/schema"

const compareStrings = (left: string, right: string): number => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

export const renderMermaidFromSnapshot = (snapshot: GraphSnapshot): string => {
  const noteNodes = snapshot.nodes
    .filter((node) => node.kind === "note")
    .sort((left, right) => {
      const idComparison = compareStrings(left.id, right.id)
      if (idComparison !== 0) {
        return idComparison
      }

      const pathComparison = compareStrings(left.relativePath, right.relativePath)
      if (pathComparison !== 0) {
        return pathComparison
      }

      return compareStrings(left.permalink, right.permalink)
    })

  const placeholderNodes = snapshot.nodes
    .filter((node) => node.kind === "placeholder")
    .sort((left, right) => {
      const idComparison = compareStrings(left.id, right.id)
      if (idComparison !== 0) {
        return idComparison
      }

      return compareStrings(left.unresolvedTarget, right.unresolvedTarget)
    })

  const renderedNodes = [...noteNodes, ...placeholderNodes]
  const renderedNodeIds = new Set(renderedNodes.map((node) => node.id))
  const nodeMermaidIds = new Map(
    renderedNodes.map((node, index) => [node.id, `n${index}`] as const),
  )

  const edgeLines = snapshot.edges
    .filter(
      (edge) => renderedNodeIds.has(edge.sourceNodeId) && renderedNodeIds.has(edge.targetNodeId),
    )
    .sort((left, right) => {
      const sourceComparison = compareStrings(left.sourceNodeId, right.sourceNodeId)
      if (sourceComparison !== 0) {
        return sourceComparison
      }

      const targetComparison = compareStrings(left.targetNodeId, right.targetNodeId)
      if (targetComparison !== 0) {
        return targetComparison
      }

      const sourcePathComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
      if (sourcePathComparison !== 0) {
        return sourcePathComparison
      }

      const wikilinkComparison = compareStrings(left.rawWikilink, right.rawWikilink)
      if (wikilinkComparison !== 0) {
        return wikilinkComparison
      }

      const targetComparison2 = compareStrings(left.target, right.target)
      if (targetComparison2 !== 0) {
        return targetComparison2
      }

      const strategyComparison = compareStrings(left.resolutionStrategy, right.resolutionStrategy)
      if (strategyComparison !== 0) {
        return strategyComparison
      }

      return compareStrings(left.displayText ?? "", right.displayText ?? "")
    })
    .map((edge) => {
      const sourceId = nodeMermaidIds.get(edge.sourceNodeId)!
      const targetId = nodeMermaidIds.get(edge.targetNodeId)!
      return `  ${sourceId} --> ${targetId}`
    })

  const noteNodeLines = noteNodes.map(
    (node, index) => `  n${index}[${JSON.stringify(node.relativePath)}]`,
  )
  const placeholderNodeLines = placeholderNodes.map(
    (node, index) =>
      `  n${noteNodes.length + index}[${JSON.stringify(`unresolved:${node.unresolvedTarget}`)}]`,
  )
  const placeholderClassLines = placeholderNodes.map(
    (_, index) => `  class n${noteNodes.length + index} unresolved`,
  )
  const hasPlaceholderNodes = placeholderNodes.length > 0

  return [
    "graph LR",
    ...noteNodeLines,
    ...placeholderNodeLines,
    ...edgeLines,
    ...(hasPlaceholderNodes
      ? ["  classDef unresolved fill:#fff4e5,stroke:#d97706,color:#7c2d12,stroke-width:1px"]
      : []),
    ...placeholderClassLines,
  ].join("\n")
}
