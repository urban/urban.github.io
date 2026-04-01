import { basename } from "node:path"
import { Effect, Schema } from "effect"
import {
  GraphSnapshotSchema,
  buildGraphSnapshotFromMarkdownSources,
  type GraphSnapshot,
  type GraphSnapshotNoteNode,
  type MarkdownSourceFile,
} from "@urban/build-graph"
import { RuntimeServer } from "./RuntimeServer"
import { Content } from "./services/Content"
import type { ContentService } from "./services/Content"
import type { VaultEntry } from "./services/Content"
import { toVaultRoutePath } from "./vault"

export type VaultGraphModel = {
  readonly snapshot: GraphSnapshot
}

export type VaultBacklink = {
  readonly count: number
  readonly nodeId: string
  readonly routePath: string
  readonly slug: string
  readonly title: string
}

const normalizeVaultGraphFrontmatter = (source: string): string =>
  source.replace(/^---\r?\n([\s\S]*?)\r?\n---/u, (match, frontmatter: string) => {
    const normalizedFrontmatter = frontmatter
      .replace(/^createdAt:/mu, "created:")
      .replace(/^updatedAt:/mu, "updated:")

    return match.replace(frontmatter, normalizedFrontmatter)
  })

const buildGraphModelEffect = Effect.gen(function* () {
  const content: ContentService = yield* Content
  const entries: ReadonlyArray<VaultEntry> = yield* content.getPublishedVault()
  const markdownSources = entries.map(
    (entry): MarkdownSourceFile => ({
      absolutePath: entry.filepath,
      relativePath: basename(entry.filepath),
      source: normalizeVaultGraphFrontmatter(entry.rawSource),
    }),
  )
  const result = yield* buildGraphSnapshotFromMarkdownSources(markdownSources, {
    identityStrategy: "canonical-route",
    routePrefix: "/vault",
  })

  return {
    snapshot: Schema.decodeUnknownSync(GraphSnapshotSchema)(result.snapshot),
  }
})

let cachedVaultGraphModelPromise: Promise<VaultGraphModel> | undefined

export const getVaultGraphModel = (): Promise<VaultGraphModel> => {
  if (cachedVaultGraphModelPromise === undefined) {
    cachedVaultGraphModelPromise = RuntimeServer.runPromise(buildGraphModelEffect)
  }

  return cachedVaultGraphModelPromise
}

export const resolveSelectedVaultNodeId = (snapshot: GraphSnapshot, slug: string): string => {
  const selectedNodeId =
    snapshot.indexes.noteNodeIdBySlug?.[slug] ??
    snapshot.indexes.noteNodeIdByRoutePath?.[toVaultRoutePath(slug)]

  if (selectedNodeId === undefined) {
    throw new Error(`Missing vault graph node id for slug: ${slug}`)
  }

  return selectedNodeId
}

const getVaultBacklinkTitle = (node: GraphSnapshotNoteNode): string =>
  node.title ?? node.label ?? node.slug ?? node.relativePath

export const getVaultBacklinks = (
  snapshot: GraphSnapshot,
  targetNodeId: string,
): ReadonlyArray<VaultBacklink> => {
  const incomingEdges = snapshot.indexes.edgesByTargetNodeId[targetNodeId] ?? []
  const backlinksBySourceNodeId = new Map<string, VaultBacklink>()

  for (const edge of incomingEdges) {
    const sourceNode = snapshot.indexes.nodesById[edge.sourceNodeId]
    if (sourceNode === undefined || sourceNode.kind !== "note") {
      continue
    }

    if (sourceNode.routePath === undefined || sourceNode.slug === undefined) {
      continue
    }

    const backlink = backlinksBySourceNodeId.get(sourceNode.id)
    if (backlink === undefined) {
      backlinksBySourceNodeId.set(sourceNode.id, {
        count: 1,
        nodeId: sourceNode.id,
        routePath: sourceNode.routePath,
        slug: sourceNode.slug,
        title: getVaultBacklinkTitle(sourceNode),
      })
      continue
    }

    backlinksBySourceNodeId.set(sourceNode.id, {
      ...backlink,
      count: backlink.count + 1,
    })
  }

  return [...backlinksBySourceNodeId.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count
    }

    return left.title.localeCompare(right.title)
  })
}

export const getSelectedVaultNodeId = async (slug: string): Promise<string> => {
  const { snapshot } = await getVaultGraphModel()
  return resolveSelectedVaultNodeId(snapshot, slug)
}
