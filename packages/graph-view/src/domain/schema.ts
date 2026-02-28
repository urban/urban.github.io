export type GraphSnapshotResolutionStrategy = "path" | "filename" | "alias" | "unresolved"

export type GraphSnapshotNoteNode = {
  readonly id: string
  readonly kind: "note"
  readonly relativePath: string
  readonly permalink: string
}

export type GraphSnapshotPlaceholderNode = {
  readonly id: string
  readonly kind: "placeholder"
  readonly unresolvedTarget: string
}

export type GraphSnapshotNode = GraphSnapshotNoteNode | GraphSnapshotPlaceholderNode

export type GraphSnapshotEdge = {
  readonly sourceNodeId: string
  readonly targetNodeId: string
  readonly sourceRelativePath: string
  readonly rawWikilink: string
  readonly target: string
  readonly displayText?: string
  readonly resolutionStrategy: GraphSnapshotResolutionStrategy
}

export type UnresolvedWikilinkDiagnostic = {
  readonly type: "unresolved-wikilink"
  readonly sourceRelativePath: string
  readonly rawWikilink: string
  readonly target: string
  readonly placeholderNodeId: string
}

export type GraphSnapshot = {
  readonly nodes: ReadonlyArray<GraphSnapshotNode>
  readonly edges: ReadonlyArray<GraphSnapshotEdge>
  readonly diagnostics: ReadonlyArray<UnresolvedWikilinkDiagnostic>
}
