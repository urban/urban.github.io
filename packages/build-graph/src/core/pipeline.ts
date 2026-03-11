import { Effect, FileSystem } from "effect"
import type { BuildGraphOptions, GraphSnapshot } from "../domain/schema"
import { discoverMarkdownFiles } from "../cli/discover"
import { buildGraphSnapshot } from "./build"
import { parseWikilinks } from "./parse"
import {
  validateMarkdownSources,
  type MarkdownSourceFile,
  type ValidatedMarkdownFile,
} from "./validate"
import type { ParsedWikilinkWithSource } from "./resolve"

export type BuildGraphSnapshotResult = {
  readonly snapshot: GraphSnapshot
  readonly validatedNotes: ReadonlyArray<ValidatedMarkdownFile>
  readonly wikilinks: ReadonlyArray<ParsedWikilinkWithSource>
}

const parseWikilinksWithSource = (
  validatedNotes: ReadonlyArray<ValidatedMarkdownFile>,
): ReadonlyArray<ParsedWikilinkWithSource> =>
  validatedNotes.flatMap((note) =>
    parseWikilinks(note.body).map((wikilink) => ({
      ...wikilink,
      sourceRelativePath: note.sourceRelativePath,
    })),
  )

export const buildGraphSnapshotFromMarkdownSources = Effect.fn(
  "buildGraph.buildGraphSnapshotFromMarkdownSources",
)((markdownFiles: ReadonlyArray<MarkdownSourceFile>, options?: BuildGraphOptions) =>
  Effect.gen(function* () {
    const validatedNotes = yield* validateMarkdownSources(markdownFiles, options)
    const wikilinks = parseWikilinksWithSource(validatedNotes)
    return {
      snapshot: buildGraphSnapshot(validatedNotes, wikilinks),
      validatedNotes,
      wikilinks,
    }
  }),
)

export const buildGraphSnapshotFromRoot = Effect.fn("buildGraph.buildGraphSnapshotFromRoot")(
  (rootDirectory: string, options?: BuildGraphOptions) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const discoveredFiles = yield* discoverMarkdownFiles(rootDirectory)
      const markdownSources = yield* Effect.forEach(discoveredFiles, (file) =>
        fs.readFileString(file.absolutePath).pipe(
          Effect.map(
            (source): MarkdownSourceFile => ({
              relativePath: file.relativePath,
              absolutePath: file.absolutePath,
              source,
            }),
          ),
        ),
      )

      return yield* buildGraphSnapshotFromMarkdownSources(markdownSources, options)
    }),
)
