import { Config, Context, Effect, Layer } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { extractMetadata } from "#utils/mdxUtils";
import { NodeContext } from "@effect/platform-node";
import { Slug } from "./Slug";

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const contentDir = yield* Config.string("CONTENT_DIR")

  return {
    getAllArticles: Effect.gen(function* () {
      const files = yield* fs.readDirectory(contentDir);
      const mdxFiles = files
        .filter((file) => !!path.extname(file).match(/.mdx?/))
        .map((file) => path.join(contentDir, file));
      return yield* Effect.all(mdxFiles.map(extractMetadata));
    }),
    getArticleBySlug: ({ slug }: { slug: string; }) =>
      Effect.gen(function* () {
        const filename = (yield* Slug).encode(slug);
        return yield* extractMetadata(filename);
      }).pipe(
        Effect.provide(Slug.Live)
      )
  }
})

export class Api extends Context.Tag("Api")<Api, Effect.Effect.Success<typeof make>>() {
  static readonly Live = Layer.effect(this, make).pipe(
    Layer.provide(NodeContext.layer)
  );
}
