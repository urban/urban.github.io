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
import { glob } from "tinyglobby"
import { VFile } from "vfile"
import { CollectionEntry } from "../schemas"
import { Mdx } from "./Mdx"
import { Metadata } from "./Metadata"

export class ContentError extends Schema.TaggedErrorClass<ContentError>()("ContentError", {
  error: Schema.Unknown,
}) {}

class FileGlobError extends Schema.TaggedErrorClass<FileGlobError>()("FileGlobError", {
  error: Schema.Unknown,
}) {}

export class Content extends ServiceMap.Service<Content>()("service/Content", {
  make: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const contentDir = "./content"
    const mdx = yield* Mdx
    const metadata = yield* Metadata
    const currentDate = pipe(yield* DateTime.now, DateTime.toDate)

    const getCollection = (collection: "articles" | "work" | "projects") =>
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
                  Effect.flatMap((compiled) => mdx.run(compiled)),
                  Effect.map(({ default: Content }) => ({
                    ...data,
                    Content,
                  })),
                ),
              ),
            ),
          ),
        )
      })

    return {
      getCollection: (collection: "articles" | "projects" | "work") =>
        getCollection(collection).pipe(
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
      getArticles: () =>
        getCollection("articles").pipe(
          Effect.flatMap((entries) =>
            Effect.all(
              entries.map((entry) =>
                metadata.article(entry.data).pipe(Effect.map((data) => ({ ...entry, data }))),
              ),
            ),
          ),
          Effect.tapError((error) => Console.log(error)),
          Effect.mapError((error) => new ContentError({ error })),
        ),
      getProjects: () =>
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
      getWork: () =>
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
    }
  }),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
