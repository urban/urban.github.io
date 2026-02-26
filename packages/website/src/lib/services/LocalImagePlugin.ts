import { NodeServices } from "@effect/platform-node"
import { Effect, Layer, Path, Schema, ServiceMap } from "effect"
import type { Root } from "hast"
import { visit } from "unist-util-visit"
import type { VFile } from "vfile"
import { VFileData } from "../schemas"
import { WebsiteConfig } from "./WebsiteConfig"

export class LocalImagePlugin extends ServiceMap.Service<
  LocalImagePlugin,
  () => (tree: Root, file: VFile) => void
>()("LocalImagePlugin", {
  make: Effect.gen(function* () {
    const path = yield* Path.Path
    const config = yield* WebsiteConfig
    const contentDir = config.contentDir
    const assetDir = config.assetDir

    return () => (tree: Root, file: VFile) => {
      const { filepath } = Schema.decodeUnknownSync(VFileData)(file.data)
      const toPath = path.join(
        path.relative("public", assetDir),
        path.relative(contentDir, path.dirname(filepath)),
      )
      visit(tree, "element", (node) => {
        if (node.tagName === "img" && node.properties.src) {
          const src = node.properties.src
          if (typeof src === "string" && src.startsWith("./")) {
            node.properties = {
              ...node.properties,
              src: path.join("/", toPath, src),
            }
          }
        }
      })
    }
  }).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, WebsiteConfig.layer))),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
