import { Path } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Effect, Layer, Schema } from "effect";
import type { Root } from "hast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { VFileData } from "../schemas";
import { WebsiteConfig } from "./WebsiteConfig";

export class LocalImagePlugin extends Effect.Service<LocalImagePlugin>()("LocalImagePlugin", {
  // dependencies: [NodeContext.layer],
  effect: Effect.gen(function* () {
    const path = yield* Path.Path;
    const config = yield* WebsiteConfig;
    const contentDir = config.contentDir;
    const assetDir = config.assetDir;

    return () => (tree: Root, file: VFile) => {
      const { filepath } = Schema.decodeUnknownSync(VFileData)(file.data);
      const toPath = path.join(
        path.relative("public", assetDir),
        path.relative(contentDir, path.dirname(filepath)),
      );
      visit(tree, "element", (node) => {
        if (node.tagName === "img" && node.properties.src) {
          const src = node.properties.src;
          if (typeof src === "string" && src.startsWith("./")) {
            node.properties = {
              ...node.properties,
              src: path.join("/", toPath, src),
            };
          }
        }
      });
    };
  }).pipe(Effect.provide(Layer.mergeAll(NodeContext.layer, WebsiteConfig.layer))),
}) {}
