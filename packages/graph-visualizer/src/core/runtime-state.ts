import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import type { GraphRenderEdge, GraphRenderModel } from "./model"

export type GraphInteractionSnapshot = {
  readonly pointerNodeId: string | null
  readonly hoveredNodeId: string | null
  readonly highlightedNodeIds: ReadonlyArray<string>
  readonly highlightedEdgeIds: ReadonlyArray<string>
  readonly mutedNodeIds: ReadonlyArray<string>
  readonly mutedEdgeIds: ReadonlyArray<string>
}

export type GraphInteractionRuntime = {
  readonly setPointerNodeId: (nodeId: string | null) => void
  readonly readSnapshot: () => GraphInteractionSnapshot
}

const sortStrings = (values: Iterable<string>): ReadonlyArray<string> =>
  [...values].sort((left, right) => left.localeCompare(right))

const edgeId = (edge: GraphRenderEdge): string => `${edge.sourceNodeId}=>${edge.targetNodeId}`

export const makeGraphInteractionRuntime = (model: GraphRenderModel): GraphInteractionRuntime => {
  const registry = AtomRegistry.make()
  const knownNodeIds = new Set<string>(model.nodes.map((node) => node.id))
  const allNodeIds = sortStrings(knownNodeIds)
  const allEdges = model.edges.map((edge) => ({ ...edge, id: edgeId(edge) }))
  const allEdgeIds = allEdges.map((edge) => edge.id)

  const pointerNodeIdAtom = Atom.make<string | null>(null).pipe(Atom.keepAlive)
  const hoveredNodeIdAtom = Atom.make((get): string | null => {
    const pointerNodeId = get(pointerNodeIdAtom)
    if (pointerNodeId === null) {
      return null
    }
    return knownNodeIds.has(pointerNodeId) ? pointerNodeId : null
  }).pipe(Atom.keepAlive)

  const highlightedNodeIdsAtom = Atom.make((get): ReadonlyArray<string> => {
    const hoveredNodeId = get(hoveredNodeIdAtom)
    if (hoveredNodeId === null) {
      return []
    }

    const neighbors = model.adjacencyByNodeId[hoveredNodeId] ?? []
    return sortStrings([hoveredNodeId, ...neighbors])
  }).pipe(Atom.keepAlive)

  const highlightedEdgeIdsAtom = Atom.make((get): ReadonlyArray<string> => {
    const hoveredNodeId = get(hoveredNodeIdAtom)
    if (hoveredNodeId === null) {
      return []
    }

    return allEdges
      .filter((edge) => edge.sourceNodeId === hoveredNodeId || edge.targetNodeId === hoveredNodeId)
      .map((edge) => edge.id)
  }).pipe(Atom.keepAlive)

  const mutedNodeIdsAtom = Atom.make((get): ReadonlyArray<string> => {
    const highlightedNodeIds = get(highlightedNodeIdsAtom)
    if (highlightedNodeIds.length === 0) {
      return []
    }
    const highlightedSet = new Set(highlightedNodeIds)
    return allNodeIds.filter((nodeId) => !highlightedSet.has(nodeId))
  }).pipe(Atom.keepAlive)

  const mutedEdgeIdsAtom = Atom.make((get): ReadonlyArray<string> => {
    const highlightedEdgeIds = get(highlightedEdgeIdsAtom)
    if (highlightedEdgeIds.length === 0) {
      return []
    }
    const highlightedSet = new Set(highlightedEdgeIds)
    return allEdgeIds.filter((id) => !highlightedSet.has(id))
  }).pipe(Atom.keepAlive)

  return {
    setPointerNodeId: (nodeId) => {
      registry.set(pointerNodeIdAtom, nodeId)
    },
    readSnapshot: () => ({
      pointerNodeId: registry.get(pointerNodeIdAtom),
      hoveredNodeId: registry.get(hoveredNodeIdAtom),
      highlightedNodeIds: registry.get(highlightedNodeIdsAtom),
      highlightedEdgeIds: registry.get(highlightedEdgeIdsAtom),
      mutedNodeIds: registry.get(mutedNodeIdsAtom),
      mutedEdgeIds: registry.get(mutedEdgeIdsAtom),
    }),
  }
}
