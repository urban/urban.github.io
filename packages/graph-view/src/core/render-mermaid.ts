import type { GraphSnapshot } from "../domain/schema"

const compareStrings = (left: string, right: string): number => left.localeCompare(right)

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

  const noteNodeIds = new Set(noteNodes.map((node) => node.id))
  const noteNodeMermaidIds = new Map(
    noteNodes.map((node, index) => [node.id, `n${index}`] as const),
  )

  const edgeLines = snapshot.edges
    .filter((edge) => noteNodeIds.has(edge.sourceNodeId) && noteNodeIds.has(edge.targetNodeId))
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
      const sourceId = noteNodeMermaidIds.get(edge.sourceNodeId)!
      const targetId = noteNodeMermaidIds.get(edge.targetNodeId)!
      return `  ${sourceId} --> ${targetId}`
    })

  const nodeLines = noteNodes.map(
    (node, index) => `  n${index}[${JSON.stringify(node.relativePath)}]`,
  )

  return ["graph LR", ...nodeLines, ...edgeLines].join("\n")
}
