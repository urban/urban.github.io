import { NodeServices } from "@effect/platform-node"
import { Array, Console, Data, Effect, FileSystem, Layer, Path, pipe } from "effect"
import { glob } from "tinyglobby"
import { WebsiteConfig } from "../src/lib/services/WebsiteConfig"

class GlobError extends Data.TaggedError("ContentError")<{
  error: unknown
}> {}

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const config = yield* WebsiteConfig
  const contentDir = config.contentDir
  const assetDir = config.assetDir

  const assetPattersn = pipe(
    ["**/*.{apng,avif,gif,jpg,jpeg,jfif,pjpeg,pjp,png,svg,webp}"],
    Array.map((pattern) => path.join(contentDir, pattern)),
  )

  const filepaths = yield* Effect.tryPromise({
    try: () => glob(assetPattersn),
    catch: (error) => new GlobError({ error }),
  }).pipe(Effect.tapError((error) => Console.log(error)))

  yield* Effect.all(
    filepaths.map((fromPath) =>
      Effect.gen(function* () {
        const toPath = path.join(assetDir, path.relative(contentDir, fromPath))
        yield* fs.makeDirectory(path.dirname(toPath), { recursive: true })
        yield* fs.copyFile(fromPath, toPath)
      }),
    ),
  )
})

await program.pipe(
  Effect.tapError(Effect.logError),
  Effect.provide(Layer.mergeAll(NodeServices.layer, WebsiteConfig.layer)),
  Effect.runPromise,
)
