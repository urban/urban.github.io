import {
  Array,
  Console,
  DateTime,
  Effect,
  FileSystem,
  Layer,
  Order,
  Path,
  pipe,
  Schema,
  ServiceMap,
} from "effect"
import matter from "gray-matter"
import { createElement } from "react"
import type { JSX } from "react"
import { glob } from "tinyglobby"
import { VFile } from "vfile"
import { Essay, CollectionEntry, CompiledVFileData, Project, Work } from "../schemas"
import {
  buildPublishedWikiLinkLookup,
  finalizeData,
  preprocessVaultMarkdownSource as preprocessNoteMarkdownSource,
} from "../note"
import type { NoteData, NoteMetadataSeed } from "../note"
import { Mdx } from "./Mdx"
import { Metadata } from "./Metadata"

export class ContentError extends Schema.TaggedErrorClass<ContentError>()("ContentError", {
  error: Schema.Unknown,
}) {}

class FileGlobError extends Schema.TaggedErrorClass<FileGlobError>()("FileGlobError", {
  error: Schema.Unknown,
}) {}

type MdxContentComponent = () => JSX.Element

type CompiledCollectionEntry<TData> = {
  readonly source: string
  readonly filepath: string
  readonly slug: string
  readonly data: TData
  readonly Content: MdxContentComponent
}

export type NoteEntry = CompiledCollectionEntry<NoteData> & {
  readonly rawSource: string
}

type NoteSourceEntry = {
  readonly rawSource: string
  readonly source: string
  readonly data: unknown
  readonly filepath: string
}

type PreparedNoteEntry = NoteSourceEntry & {
  readonly metadata: NoteMetadataSeed
}

export type ContentService = {
  readonly getCollection: (
    collection: "essays" | "projects" | "work",
  ) => Effect.Effect<ReadonlyArray<typeof CollectionEntry.Type>, ContentError>
  readonly getEssays: () => Effect.Effect<
    ReadonlyArray<CompiledCollectionEntry<typeof Essay.Type>>,
    ContentError
  >
  readonly getProjects: () => Effect.Effect<
    ReadonlyArray<CompiledCollectionEntry<typeof Project.Type>>,
    ContentError
  >
  readonly getWork: () => Effect.Effect<
    ReadonlyArray<CompiledCollectionEntry<typeof Work.Type>>,
    ContentError
  >
  readonly getNotes: () => Effect.Effect<ReadonlyArray<NoteEntry>, ContentError>
  readonly getPublishedNotes: () => Effect.Effect<ReadonlyArray<NoteEntry>, ContentError, Content>
  readonly findPublishedNotesBySlug: (
    pathSlug: string,
  ) => Effect.Effect<NoteEntry | undefined, ContentError, Content>
}
export class Content extends ServiceMap.Service<Content>()("service/Content", {
  make: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const contentDir = "./content"
    const mdx = yield* Mdx
    const metadata = yield* Metadata
    const currentDate = pipe(yield* DateTime.now, DateTime.toDate)

    const getCollection = (collection: "essays" | "work" | "projects") =>
      Effect.gen(function* () {
        const isPathWithIndex = collection !== "work"
        const pattern = isPathWithIndex ? "*/index.{md,mdx}" : "*.{md,mdx}"
        const filepaths = yield* Effect.tryPromise({
          try: () => glob([path.join(contentDir, collection, pattern)]),
          catch: (error) => new FileGlobError({ error }),
        }).pipe(Effect.tapError((error) => Console.log(error)))

        return yield* Effect.all(
          filepaths.map((filepath) =>
            fs.readFileString(filepath, "utf-8").pipe(
              // create slug and relative filepath
              // extract content and parse fronmatter
              Effect.map((rawSource) => {
                const slug = isPathWithIndex
                  ? filepath.split(path.sep).slice(-2, -1)[0]
                  : filepath.split(path.sep).slice(-1)[0]
                const { content: source, data } = matter(rawSource)
                return {
                  source,
                  data,
                  slug,
                  filepath,
                }
              }),
              //
              Effect.flatMap(Schema.decodeUnknownEffect(CollectionEntry)),
              // Compile MDX
              Effect.flatMap((data) =>
                mdx.compile(new VFile({ data: { filepath }, value: data.source })).pipe(
                  Effect.flatMap((compiled) =>
                    mdx.run(compiled).pipe(
                      Effect.map(({ default: MdxContent }) => {
                        const RenderContent: MdxContentComponent = () => createElement(MdxContent)
                        return {
                          ...data,
                          Content: RenderContent,
                        }
                      }),
                    ),
                  ),
                ),
              ),
            ),
          ),
        )
      })

    return {
      getCollection: (
        collection: "essays" | "projects" | "work",
      ): Effect.Effect<ReadonlyArray<typeof CollectionEntry.Type>, ContentError> =>
        getCollection(collection).pipe(
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
      getEssays: (): Effect.Effect<
        ReadonlyArray<CompiledCollectionEntry<typeof Essay.Type>>,
        ContentError
      > =>
        getCollection("essays").pipe(
          Effect.flatMap((entries) =>
            Effect.all(
              entries.map((entry) =>
                metadata.essay(entry.data).pipe(Effect.map((data) => ({ ...entry, data }))),
              ),
            ),
          ),
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
      getProjects: (): Effect.Effect<
        ReadonlyArray<CompiledCollectionEntry<typeof Project.Type>>,
        ContentError
      > =>
        getCollection("projects").pipe(
          Effect.flatMap((entries) =>
            Effect.all(
              entries.map((entry) =>
                metadata.project(entry.data).pipe(Effect.map((data) => ({ ...entry, data }))),
              ),
            ),
          ),
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
      getWork: (): Effect.Effect<
        ReadonlyArray<CompiledCollectionEntry<typeof Work.Type>>,
        ContentError
      > =>
        getCollection("work").pipe(
          Effect.flatMap((entries) =>
            Effect.all(
              entries.map((entry) =>
                metadata.work(entry.data).pipe(Effect.map((data) => ({ ...entry, data }))),
              ),
            ),
          ),
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
          Effect.map(
            Array.sortBy(
              Order.flip(
                Order.mapInput(Order.Date, ({ data }) =>
                  data.dateEnd === "Present" ? currentDate : data.dateEnd,
                ),
              ),
            ),
          ),
        ),
      getNotes: (): Effect.Effect<ReadonlyArray<NoteEntry>, ContentError> =>
        Effect.gen(function* () {
          const filepaths = yield* Effect.tryPromise({
            try: () => glob([path.join(contentDir, "vault", "*.md")]),
            catch: (error) => new FileGlobError({ error }),
          }).pipe(Effect.tapError((error) => Console.log(error)))

          const sourceEntries: ReadonlyArray<NoteSourceEntry> = yield* Effect.all(
            filepaths.map((filepath) =>
              fs.readFileString(filepath, "utf-8").pipe(
                Effect.map((rawSource) => {
                  const { content: source, data } = matter(rawSource)
                  return {
                    rawSource,
                    source,
                    data,
                    filepath,
                  }
                }),
              ),
            ),
          )

          const preparedEntries: ReadonlyArray<PreparedNoteEntry> = yield* Effect.all(
            sourceEntries.map((entry) =>
              metadata.seed(entry.data).pipe(
                Effect.map((noteMetadata) => ({
                  ...entry,
                  metadata: noteMetadata,
                })),
              ),
            ),
          )

          const publishedLookup = buildPublishedWikiLinkLookup(
            preparedEntries
              .filter(({ metadata }) => metadata.published)
              .map(({ metadata }) => ({
                slug: metadata.slug,
                title: metadata.title,
                aliases: metadata.aliases,
              })),
          )

          return yield* Effect.all(
            preparedEntries.map((entry) => {
              const preprocessedSource = preprocessNoteMarkdownSource(entry.source, publishedLookup)

              return mdx
                .compile(
                  new VFile({
                    data: { filepath: entry.filepath },
                    value: preprocessedSource,
                  }),
                )
                .pipe(
                  Effect.flatMap((compiled) =>
                    mdx.run(compiled).pipe(
                      Effect.map(({ default: MdxContent }) => {
                        const data = finalizeData(
                          entry.metadata,
                          Schema.decodeUnknownSync(CompiledVFileData)(compiled.data)
                            .descriptionExcerpt,
                        )
                        const RenderContent: MdxContentComponent = () => createElement(MdxContent)

                        return {
                          rawSource: entry.rawSource,
                          source: entry.source,
                          filepath: entry.filepath,
                          slug: data.slug,
                          data,
                          Content: RenderContent,
                        }
                      }),
                    ),
                  ),
                )
            }),
          )
        }).pipe(
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
          Effect.map(Array.sortBy(Order.mapInput(Order.String, ({ slug }) => slug))),
        ),
      getPublishedNotes: (): Effect.Effect<ReadonlyArray<NoteEntry>, ContentError, Content> =>
        Effect.gen(function* () {
          const content: ContentService = yield* Content
          const entries = yield* content.getNotes()
          return entries.filter(({ data }) => data.published)
        }).pipe(
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
      findPublishedNotesBySlug: (
        pathSlug: string,
      ): Effect.Effect<NoteEntry | undefined, ContentError, Content> =>
        Effect.gen(function* () {
          const content: ContentService = yield* Content
          const entries = yield* content.getPublishedNotes()
          return entries.find(({ slug }) => slug === pathSlug)
        }).pipe(
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
    }
  }),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
