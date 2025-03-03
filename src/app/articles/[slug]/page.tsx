import { Effect } from "effect";
import { NodeContext } from "@effect/platform-node";
import { Api } from "#services/Articles";
import { RuntimeServer } from "#services/RuntimeServer";

import styles from "../../page.module.css";
import SiteHeader from "#components/SiteHeader";
import { redirect } from "next/navigation";
import Article from "#components/Article";

const main = (slug: string) =>
  Effect.gen(function* () {
    const api = yield* Api;
    return yield* api.getArticleBySlug({ slug });
  }).pipe(Effect.provide(NodeContext.layer));

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const result = await RuntimeServer.runPromise(
    main(slug).pipe(
      Effect.match({
        // onFailure: () => <span>Error</span>,
        onFailure: (error) => {
          console.log("ERROR:");
          console.log(error);
          // return redirect("/articles");
          return 'error' as const;
        },
        onSuccess: (article) => article,
      })
    ));

  if (result === 'error') {
    return redirect("/articles"); 
  }

  // 👇 Redirect to the index `/articles/` if the slug is invalid
  // Effect.catchAll((error) =>
  //   Effect.sync(() => {
  //     console.log("ERROR:");
  //     console.log(error);
  //     return redirect("/articles");
  //   })
  // )

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <Article article={result} />
      </main>
    </div>
  );
}

const mainAll = Effect.gen(function* () {
  const api = yield* Api;
  const result = yield* api.getAllArticles;
  // 👇 Slug (from file name)
  return result.map((s) => ({ slug: s.slug }));
}).pipe(Effect.provide(NodeContext.layer));

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(mainAll);
}
