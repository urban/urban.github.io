import { NodeServices } from "@effect/platform-node"
import { Console, Data, Effect, FileSystem, Layer, Path } from "effect"
import { getSectionVisibility } from "../src/lib/sections"

class ProductionSectionError extends Data.TaggedError("ProductionSectionError")<{
  readonly message: string
}> {}

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const sections = getSectionVisibility(false)
  const disabled = [
    ...(!sections.now ? [{ route: "now", assets: "now" }] : []),
    ...(!sections.garden ? [{ route: "garden", assets: "vault" }] : []),
  ]
  for (const section of disabled) {
    for (const directory of [`dist/${section.route}`, `dist/assets/${section.assets}`]) {
      if (yield* fs.exists(directory)) {
        return yield* new ProductionSectionError({
          message: `Disabled section output exists: ${directory}`,
        })
      }
    }
  }
  const files = yield* fs.readDirectory("dist", { recursive: true })
  for (const file of files.filter((entry) => entry.endsWith(".html"))) {
    const html = yield* fs.readFileString(path.join("dist", file))
    for (const section of disabled) {
      const link = new RegExp(`(?:href|src)=["']/(${section.route})(?:[/?#"'])`, "u")
      if (link.test(html)) {
        return yield* new ProductionSectionError({
          message: `Link to disabled section in ${file}: ${section.route}`,
        })
      }
    }
  }
  return yield* Console.log(
    `Production verified: ${disabled.map(({ route }) => route).join(", ") || "no sections"} excluded; ${files.filter((entry) => entry.endsWith(".html")).length} HTML pages checked.`,
  )
})

await program.pipe(
  Effect.tapError(Effect.logError),
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- This script is the application entry point.
  Effect.provide(Layer.mergeAll(NodeServices.layer)),
  Effect.runPromise,
)
