import { Config, Context, Effect, Layer } from "effect";
import { Path } from "@effect/platform";
import { NodePath } from "@effect/platform-node";

const make = Effect.gen(function* () {
  const path = yield* Path.Path;
  const contentDir = yield* Config.string("CONTENT_DIR");

  return {
    decode: (filePath: string) => path.basename(filePath, path.extname(filePath)),
    encode: (slug: string) => path.join(contentDir, `${slug}.md`)
  }
});

export class Slug extends Context.Tag("Slug")<
  Slug,
  Effect.Effect.Success<typeof make>  
>() {
  static readonly Live = Layer.effect(this, make).pipe(
    Layer.provide(NodePath.layer)
  )
}
