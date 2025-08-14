import { Effect, Data } from "effect";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeUnwrapImages from "rehype-unwrap-images";
import rehypeCallouts from "rehype-callouts";
import remarkGfm from "remark-gfm";
import { HeadingsPlugin } from "./HeadingsPlugin";
import { LocalImagePlugin } from "./LocalImagePlugin";
import type { MDXModule } from "mdx/types";
import type { VFile } from "vfile";
import rehypeShiki from "@shikijs/rehype";

export class MdxError extends Data.TaggedError("MdxError")<{
  error: unknown;
  type: "compile" | "run";
}> {}

export class Mdx extends Effect.Service<Mdx>()("Mdx", {
  dependencies: [HeadingsPlugin.Default, LocalImagePlugin.Default],
  effect: Effect.gen(function* () {
    const headings = yield* HeadingsPlugin;
    const localImagePlugin = yield* LocalImagePlugin;

    // wrap the compile and run functions from @mdx-js/mdx
    // to include the plugins and error handling
    return {
      compile: (content: VFile) =>
        Effect.tryPromise({
          try: () =>
            compile(content, {
              outputFormat: "function-body",
              remarkPlugins: [remarkGfm],
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
            }) as Promise<MDXModule>,
          catch: (error) => new MdxError({ error, type: "run" }),
        }).pipe(Effect.tapError(Effect.logError)),
    };
  }),
}) {}
