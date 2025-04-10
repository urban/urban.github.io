import * as styles from '../page.css';
import { SiteHeader } from "#components/SiteHeader";
import { Effect, Match } from "effect";
import { Api } from "#services/Articles";
import { RuntimeServer } from "#services/RuntimeServer";
import Articles from "#components/Articles";
import { H4 } from '../../components/Typography';

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
        <H4>Articles</H4>
        {/* Execute 'main' using `RuntimeServer`*/}
        {await RuntimeServer.runPromise(
          main.pipe(
            Effect.match({
              onFailure: Match.valueTags({
                ParseError: () => <span>ParseError</span>,
                BadArgument: () => <span>BadArgument</span>,
                SystemError: () => <span>SystemError</span>,
                ConfigError: () => <span>ConfigError</span>,
              }),
              onSuccess: (articles) => <Articles articles={articles} />
            })
          )
        )}
      </main>
    </div>
  );
}
