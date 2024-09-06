import { Effect } from "effect";
import * as ReadonlyArray from "effect/Array";
import * as Content from "../../../services/content-service";

import styles from "../../page.module.css";
import SiteHeader from "../../../components/SiteHeader";
import { redirect } from "next/navigation";

const main = (slug: string) =>
  Effect.gen(function* (_) {
    const contentService = yield* _(Content.ContentService);
    return yield* _(contentService.getArticleBySlug({ slug }));
  }).pipe(Effect.provide(Content.ContentServiceLive));

const mainAll = Effect.gen(function* (_) {
  const contentService = yield* _(Content.ContentService);
  return yield* _(
    contentService.getAllArticles(),
    // 👇 Slug (from file name)
    Effect.map(ReadonlyArray.map((s) => ({ slug: s.slug })))
  );
}).pipe(Effect.provide(Content.ContentServiceLive));

export default async function Page({ params: { slug } }: { params: { slug: string; }}) {
  console.log('/articles/[slug]', slug);
  console.log({ slug });

  const { source, frontmatter } = await main(
    slug
  ).pipe(
    // 👇 Redirect to the index `/articles/` if the slug is invalid
    Effect.catchAll(() => Effect.sync(() => redirect("/articles"))),
    Effect.runPromise
  );

  console.log(frontmatter);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>{frontmatter.title}</h4>
        <div className={styles.work}>
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return await mainAll.pipe(Effect.runPromise);
}
