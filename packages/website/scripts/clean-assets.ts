import { FileSystem } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { WebsiteConfig } from "../src/lib/services/WebsiteConfig";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const config = yield* WebsiteConfig;
  const assetDir = config.assetDir;

  if (yield* fs.exists(assetDir)) {
    yield* fs.remove(assetDir, { recursive: true });
  }
});

await program.pipe(
  Effect.tapError(Effect.logError),
  Effect.provide(Layer.mergeAll(NodeContext.layer, WebsiteConfig.layer)),
  Effect.runPromise,
);
