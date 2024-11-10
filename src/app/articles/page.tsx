import styles from "../page.module.css";
import SiteHeader from "#components/SiteHeader";
import { Effect, Match } from "effect";
import { Api } from "#services/Articles";
import { RuntimeServer } from "#services/RuntimeServer";
import Articles from "#components/Articles";

// Define `main` to collect all the `articles`
const main = Effect.gen(function* () {
  const api = yield* Api; 
  return yield* api.getAllArticles;
})

export default async function Page() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>Articles</h4>
        {/* Execute 'main' using `RuntimeServer`*/}
        {await RuntimeServer.runPromise(
          main.pipe(
            Effect.match({
              onFailure: Match.valueTags({
                ParseError: (error) => <span>ParseError</span>,
                BadArgument: (error) => <span>BadArgument</span>,
                SystemError: (error) => <span>SystemError</span>,
                ConfigError: (error) => <span>ConfigError</span>,
              }),
              onSuccess: (articles) => <Articles articles={articles} />
            })
          )
        )}
      </main>
    </div>
  );
}
