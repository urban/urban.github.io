import { NodeServices } from "@effect/platform-node"
import { Effect, FileSystem, Layer } from "effect"
import { WebsiteConfig } from "../src/lib/services/WebsiteConfig"

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const config = yield* WebsiteConfig
  const assetDir = config.assetDir

  if (yield* fs.exists(assetDir)) {
    yield* fs.remove(assetDir, { recursive: true })
  }
})

await program.pipe(
  Effect.tapError(Effect.logError),
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- This script is the application entry point.
  Effect.provide(Layer.mergeAll(NodeServices.layer, WebsiteConfig.layer)),
  Effect.runPromise,
)
