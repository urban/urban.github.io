import { basename } from "node:path"
import { Effect, Schema } from "effect"
import {
  GraphSnapshotSchema,
  buildGraphSnapshotFromMarkdownSources,
  type GraphSnapshot,
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

const buildGraphModelEffect = Effect.gen(function* () {
  const content: ContentService = yield* Content
  const entries: ReadonlyArray<VaultEntry> = yield* content.getPublishedVault()
  const markdownSources = entries.map(
    (entry): MarkdownSourceFile => ({
      absolutePath: entry.filepath,
      relativePath: basename(entry.filepath),
      source: entry.rawSource,
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

export const getSelectedVaultNodeId = async (slug: string): Promise<string> => {
  const { snapshot } = await getVaultGraphModel()
  return resolveSelectedVaultNodeId(snapshot, slug)
}
