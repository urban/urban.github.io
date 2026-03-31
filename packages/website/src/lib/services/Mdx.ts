import { Effect, Layer, Schema, ServiceMap } from "effect"
import { compile, run } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"
import rehypeUnwrapImages from "rehype-unwrap-images"
import rehypeCallouts from "rehype-callouts"
import remarkGfm from "remark-gfm"
import { DescriptionExcerptPlugin } from "./DescriptionExcerptPlugin"
import { HeadingsPlugin } from "./HeadingsPlugin"
import { LocalImagePlugin } from "./LocalImagePlugin"
import type { MDXComponents, MDXModule } from "mdx/types"
import type { VFile } from "vfile"
import rehypeShiki from "@shikijs/rehype"
import { MdxLink } from "../../ui/MdxLink"

const MDX_COMPONENTS = {
  a: MdxLink,
} satisfies MDXComponents

export class MdxError extends Schema.TaggedErrorClass<MdxError>()("MdxError", {
  error: Schema.Unknown,
  type: Schema.Literals(["compile", "run"]),
}) {}

export class Mdx extends ServiceMap.Service<Mdx>()("Mdx", {
  make: Effect.gen(function* () {
    const headings = yield* HeadingsPlugin
    const descriptionExcerptPlugin = yield* DescriptionExcerptPlugin
    const localImagePlugin = yield* LocalImagePlugin

    // wrap the compile and run functions from @mdx-js/mdx
    // to include the plugins and error handling
    return {
      compile: (content: VFile) =>
        Effect.tryPromise({
          try: () =>
            compile(content, {
              outputFormat: "function-body",
              providerImportSource: "@mdx-js/react",
              remarkPlugins: [remarkGfm, descriptionExcerptPlugin],
              rehypePlugins: [
                [
                  rehypeShiki,
                  {
                    theme: "material-theme",
                  },
                ],
                headings,
                localImagePlugin,
                rehypeUnwrapImages,
                rehypeCallouts,
              ],
            }),
          catch: (error) => new MdxError({ error, type: "compile" }),
        }).pipe(Effect.tapError(Effect.logError)),

      run: (vFile: VFile) =>
        Effect.tryPromise({
          try: () =>
            run(vFile, {
              ...runtime,
              baseUrl: import.meta.url,
              useMDXComponents: () => MDX_COMPONENTS,
            }) as Promise<MDXModule>,
          catch: (error) => new MdxError({ error, type: "run" }),
        }).pipe(Effect.tapError(Effect.logError)),
    }
  }).pipe(
    Effect.provide(
      Layer.mergeAll(DescriptionExcerptPlugin.layer, HeadingsPlugin.layer, LocalImagePlugin.layer),
    ),
  ),
}) {
  static readonly layer = Layer.effect(this)(this.make)
}
