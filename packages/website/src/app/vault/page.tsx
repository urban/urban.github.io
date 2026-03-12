import { Effect } from "effect"
import type { Metadata } from "next"
import { RuntimeServer } from "../../lib/RuntimeServer"
import { Content } from "../../lib/services/Content"
import type { ContentService } from "../../lib/services/Content"
import type { VaultEntry } from "../../lib/services/Content"
import { Container } from "../../ui/Container"
import { Link } from "../../ui/Link"
import { PageNavigationAnimation } from "../../ui/PageNavigationAnimation"

const main = Effect.gen(function* () {
  const content: ContentService = yield* Content
  return yield* content.getPublishedVault()
})

export const metadata: Metadata = {
  title: "Vault",
  description: "Connected notes from the vault.",
}

export default async function Page() {
  const entries: ReadonlyArray<VaultEntry> = await RuntimeServer.runPromise(main)

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="py-10">
          <div className="animate mb-2 font-semibold text-black dark:text-white">Vault</div>
          <p className="animate mb-8 max-w-2xl text-black/70 dark:text-white/70">
            Connected notes from the vault.
          </p>
          <ul className="space-y-4">
            {entries.map((entry) => (
              <li key={entry.slug} className="animate">
                <Link href={`/vault/${entry.slug}`}>
                  <span className="font-semibold">{entry.data.title}</span>
                </Link>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  {entry.data.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </>
  )
}
