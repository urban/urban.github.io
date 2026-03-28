import { Effect } from "effect"
import { notFound } from "next/navigation"
import { RuntimeServer } from "../../lib/RuntimeServer"
import { Content } from "../../lib/services/Content"
import type { ContentService, VaultEntry } from "../../lib/services/Content"
// import { readingTime } from "../../lib/utils"
import { getSelectedVaultNodeId, getVaultGraphModel } from "../../lib/vaultGraph"
import { BackToPrev } from "../../ui/BackToPrev"
import { Container } from "../../ui/Container"
// import { FormattedDate } from "../../ui/FormattedDate"
import { PageNavigationAnimation } from "../../ui/PageNavigationAnimation"
import { VaultGraphHost } from "../../ui/VaultGraphHost"

export const getVaultEntry = (slug: string) =>
  Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.findPublishedVaultBySlug(slug)
  })

export const getVaultStaticParams = Effect.gen(function* () {
  const content: ContentService = yield* Content
  const entries: ReadonlyArray<VaultEntry> = yield* content.getPublishedVault()
  return entries.filter((entry) => entry.slug !== "index").map((entry) => ({ slug: entry.slug }))
})

export const getRequiredVaultEntry = async (slug: string): Promise<VaultEntry> => {
  const entry: VaultEntry | undefined = await RuntimeServer.runPromise(getVaultEntry(slug))
  if (entry === undefined) {
    notFound()
  }

  return entry
}

type VaultEntryPageProps = {
  readonly entry: VaultEntry
  readonly showBackToVault?: boolean
}

export async function VaultEntryPage({ entry, showBackToVault = true }: VaultEntryPageProps) {
  const [{ snapshot }, selectedNodeId] = await Promise.all([
    getVaultGraphModel(),
    getSelectedVaultNodeId(entry.slug),
  ])

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        {showBackToVault ? (
          <div className="animate">
            <BackToPrev href="/vault">Back to vault</BackToPrev>
          </div>
        ) : null}
        <div className="my-10 flex flex-col gap-10">
          <div className="max-w-3xl">
            <div className="animate mb-8">
              <h1 className="mt-2 text-2xl font-semibold text-black dark:text-white">
                {entry.data.title}
              </h1>
              {/*<div className="flex items-center gap-1.5 text-sm">
                <FormattedDate date={entry.data.updated} />
                <span>&bull;</span>
                <span>{readingTime(entry.source)}</span>
              </div>*/}
            </div>
            <article className="animate">
              <entry.Content />
            </article>
          </div>
          <div className="animate">
            <VaultGraphHost snapshot={snapshot} selectedNodeId={selectedNodeId} />
          </div>
        </div>
      </Container>
    </>
  )
}
