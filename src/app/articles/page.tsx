import styles from "../page.module.css";
import SiteHeader from "../../components/SiteHeader";
import { Effect } from "effect";
import * as Content from "../../services/content-service";
import { redirect } from "next/navigation";

const main = Effect.gen(function* (_) {
  const contentService = yield* _(Content.ContentService);
  return yield* _(contentService.getAllArticles());
}).pipe(Effect.provide(Content.ContentServiceLive));

export default async function Page() {
  const articles = await main.pipe(Effect.runPromise);
  const articlesList = (await Effect.runPromise(articles)).map(a => a.split('.')[0]);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>Articles</h4>
        <div className={styles.work}>
          <ul>
            {articlesList.map((a, idx) => (
              <li key={idx}>
                <a href={`/articles/${a}`}>{a}</a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
