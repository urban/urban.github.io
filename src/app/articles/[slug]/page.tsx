import { Effect } from "effect";
import { NodeContext } from "@effect/platform-node";
import { Api } from "#services/Articles";
import { RuntimeServer } from "#services/RuntimeServer";

import styles from "../../page.module.css";
import SiteHeader from "#components/SiteHeader";
import { redirect } from "next/navigation";
import CustomMDX from "../../../components/CustomMDX";

const main = (slug: string) =>
  Effect.gen(function* () {
    const api = yield* Api;
    return yield* api.getArticleBySlug({ slug });
  }).pipe(Effect.provide(NodeContext.layer));

const mainAll = Effect.gen(function* () {
  const api = yield* Api;
  const result = yield* api.getAllArticles;
  // 👇 Slug (from file name)
  return result.map((s) => ({ slug: s.slug }));
}).pipe(Effect.provide(NodeContext.layer));

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(mainAll);
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const data = await RuntimeServer.runPromise(
    main(slug).pipe(
      Effect.match({
        onFailure: (error) => {
          console.log("ERROR:");
          console.log(error);
          return 'error' as const;
        },
        onSuccess: (article) => article,
      })
    ));

  // 👇 Redirect to the index `/articles/` if the slug is invalid
  if (data === 'error') {
    return redirect("/articles"); 
  }

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>{data.frontmatter.title}</h4>
        <div className={styles.work}>
          <CustomMDX source={data.source} />
        </div>
      </main>
    </div>
  );
}
