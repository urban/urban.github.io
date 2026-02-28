import { Graph } from "effect"
import type {
  GraphSnapshot,
  GraphSnapshotEdge,
  GraphSnapshotNode,
  GraphSnapshotResolutionStrategy,
  UnresolvedWikilinkDiagnostic,
} from "../domain/schema"
import {
  resolveWikilinkTargetV1,
  type ParsedWikilinkWithSource,
  type WikilinkResolverV1Index,
} from "./resolve"
import { normalizeGraphSnapshot } from "./snapshot"
import type { ValidatedMarkdownFile } from "./validate"

const compareStrings = (left: string, right: string) => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

const normalizeTargetForPlaceholder = (value: string): string =>
  value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/")
    .toLowerCase()

const toPlaceholderNodeId = (target: string): string => {
  const normalizedTarget = normalizeTargetForPlaceholder(target)
  return `placeholder:${normalizedTarget.length > 0 ? normalizedTarget : "unknown"}`
}

const createWikilinkEdge = (
  sourceNodeId: string,
  targetNodeId: string,
  wikilink: ParsedWikilinkWithSource,
  resolutionStrategy: GraphSnapshotResolutionStrategy,
): GraphSnapshotEdge =>
  wikilink.displayText === undefined
    ? {
        sourceNodeId,
        targetNodeId,
        sourceRelativePath: wikilink.sourceRelativePath,
        rawWikilink: wikilink.raw,
        target: wikilink.target,
        resolutionStrategy,
      }
    : {
        sourceNodeId,
        targetNodeId,
        sourceRelativePath: wikilink.sourceRelativePath,
        rawWikilink: wikilink.raw,
        target: wikilink.target,
        displayText: wikilink.displayText,
        resolutionStrategy,
      }

export const buildGraphSnapshot = (
  notes: ReadonlyArray<ValidatedMarkdownFile>,
  resolverV1Index: WikilinkResolverV1Index,
  wikilinks: ReadonlyArray<ParsedWikilinkWithSource>,
): GraphSnapshot => {
  const noteNodeIds = new Map<string, string>()
  const nodeIndices = new Map<string, number>()
  const diagnostics: Array<UnresolvedWikilinkDiagnostic> = []
  const placeholderByNormalizedTarget = new Map<
    string,
    { readonly nodeId: string; readonly nodeIndex: number }
  >()

  const graph = Graph.directed<GraphSnapshotNode, GraphSnapshotEdge>((mutable) => {
    for (const note of [...notes].sort((left, right) =>
      compareStrings(left.relativePath, right.relativePath),
    )) {
      const nodeId = note.relativePath
      const nodeIndex = Graph.addNode(mutable, {
        id: nodeId,
        kind: "note",
        relativePath: note.relativePath,
        permalink: note.frontmatter.permalink,
      })
      noteNodeIds.set(note.relativePath, nodeId)
      nodeIndices.set(nodeId, nodeIndex)
    }

    for (const wikilink of wikilinks) {
      const sourceNodeId = noteNodeIds.get(wikilink.sourceRelativePath)
      if (sourceNodeId === undefined) {
        continue
      }

      const sourceNodeIndex = nodeIndices.get(sourceNodeId)
      if (sourceNodeIndex === undefined) {
        continue
      }

      const resolution = resolveWikilinkTargetV1(resolverV1Index, wikilink.target)
      if (resolution.candidates.length > 1) {
        continue
      }

      if (resolution.candidates.length === 1) {
        const targetRelativePath = resolution.candidates[0]?.relativePath
        if (targetRelativePath === undefined) {
          continue
        }

        const targetNodeId = noteNodeIds.get(targetRelativePath)
        if (targetNodeId === undefined) {
          continue
        }

        const targetNodeIndex = nodeIndices.get(targetNodeId)
        if (targetNodeIndex === undefined) {
          continue
        }

        Graph.addEdge(
          mutable,
          sourceNodeIndex,
          targetNodeIndex,
          createWikilinkEdge(sourceNodeId, targetNodeId, wikilink, resolution.strategy),
        )

        continue
      }

      const normalizedTarget = normalizeTargetForPlaceholder(wikilink.target)
      const existingPlaceholder = placeholderByNormalizedTarget.get(normalizedTarget)
      if (existingPlaceholder !== undefined) {
        Graph.addEdge(
          mutable,
          sourceNodeIndex,
          existingPlaceholder.nodeIndex,
          createWikilinkEdge(sourceNodeId, existingPlaceholder.nodeId, wikilink, "unresolved"),
        )
        diagnostics.push({
          type: "unresolved-wikilink",
          sourceRelativePath: wikilink.sourceRelativePath,
          rawWikilink: wikilink.raw,
          target: wikilink.target,
          placeholderNodeId: existingPlaceholder.nodeId,
        })
        continue
      }

      const placeholderNodeId = toPlaceholderNodeId(wikilink.target)
      const placeholderNodeIndex = Graph.addNode(mutable, {
        id: placeholderNodeId,
        kind: "placeholder",
        unresolvedTarget: normalizedTarget,
      })
      placeholderByNormalizedTarget.set(normalizedTarget, {
        nodeId: placeholderNodeId,
        nodeIndex: placeholderNodeIndex,
      })

      Graph.addEdge(
        mutable,
        sourceNodeIndex,
        placeholderNodeIndex,
        createWikilinkEdge(sourceNodeId, placeholderNodeId, wikilink, "unresolved"),
      )

      diagnostics.push({
        type: "unresolved-wikilink",
        sourceRelativePath: wikilink.sourceRelativePath,
        rawWikilink: wikilink.raw,
        target: wikilink.target,
        placeholderNodeId: placeholderNodeId,
      })
    }
  })

  return normalizeGraphSnapshot({
    nodes: [...graph.nodes.values()],
    edges: [...graph.edges.values()].map((edge) => edge.data),
    diagnostics,
  })
}
