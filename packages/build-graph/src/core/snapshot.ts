import { Schema } from "effect"
import { GraphSnapshotSchema, type GraphSnapshot } from "../domain/schema"

const decodeGraphSnapshot = Schema.decodeUnknownSync(GraphSnapshotSchema)

const compareStrings = (left: string, right: string) => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

export const normalizeGraphSnapshot = (snapshot: GraphSnapshot): GraphSnapshot => ({
  nodes: [...snapshot.nodes].sort((left, right) => {
    const idComparison = compareStrings(left.id, right.id)
    if (idComparison !== 0) {
      return idComparison
    }

    return compareStrings(left.kind, right.kind)
  }),
  edges: [...snapshot.edges].sort((left, right) => {
    const sourceNodeComparison = compareStrings(left.sourceNodeId, right.sourceNodeId)
    if (sourceNodeComparison !== 0) {
      return sourceNodeComparison
    }

    const targetNodeComparison = compareStrings(left.targetNodeId, right.targetNodeId)
    if (targetNodeComparison !== 0) {
      return targetNodeComparison
    }

    const rawWikilinkComparison = compareStrings(left.rawWikilink, right.rawWikilink)
    if (rawWikilinkComparison !== 0) {
      return rawWikilinkComparison
    }

    const sourcePathComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
    if (sourcePathComparison !== 0) {
      return sourcePathComparison
    }

    const targetComparison = compareStrings(left.target, right.target)
    if (targetComparison !== 0) {
      return targetComparison
    }

    const resolutionComparison = compareStrings(left.resolutionStrategy, right.resolutionStrategy)
    if (resolutionComparison !== 0) {
      return resolutionComparison
    }

    return compareStrings(left.displayText ?? "", right.displayText ?? "")
  }),
  diagnostics: [...snapshot.diagnostics].sort((left, right) => {
    const sourceComparison = compareStrings(left.sourceRelativePath, right.sourceRelativePath)
    if (sourceComparison !== 0) {
      return sourceComparison
    }

    const rawWikilinkComparison = compareStrings(left.rawWikilink, right.rawWikilink)
    if (rawWikilinkComparison !== 0) {
      return rawWikilinkComparison
    }

    const targetComparison = compareStrings(left.target, right.target)
    if (targetComparison !== 0) {
      return targetComparison
    }

    return compareStrings(left.placeholderNodeId, right.placeholderNodeId)
  }),
})

export const serializeGraphSnapshot = (snapshot: GraphSnapshot): string => {
  const normalizedSnapshot = normalizeGraphSnapshot(snapshot)
  const contractSnapshot = decodeGraphSnapshot(normalizedSnapshot)
  return `${JSON.stringify(contractSnapshot, null, 2)}\n`
}
