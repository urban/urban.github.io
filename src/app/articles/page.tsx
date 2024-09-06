import styles from "../page.module.css";
import SiteHeader from "../../components/SiteHeader";
import { Effect } from "effect";
import * as Content from "../../services/content-service";
import Link from "next/link";

const main = Effect.gen(function* (_) {
  const contentService = yield* _(Content.ContentService);
  return yield* _(contentService.getAllArticles());
}).pipe(Effect.provide(Content.ContentServiceLive));

export default async function Page() {
  const articles = await main.pipe(Effect.runPromise);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>Articles</h4>
        <div className={styles.work}>
          <ul>
            {articles.map(({ slug, frontmatter }, idx) => (
              <li key={idx}>
                <Link as={`/articles/${slug}`} href={`/articles/[slug]`}>
                  {frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
