import { Effect } from "effect"
import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import { RuntimeServer } from "../../../lib/RuntimeServer"
import { Content } from "../../../lib/services/Content"
import type { ContentService } from "../../../lib/services/Content"
import type { VaultEntry } from "../../../lib/services/Content"
import { readingTime } from "../../../lib/utils"
import { getSelectedVaultNodeId, getVaultGraphModel } from "../../../lib/vaultGraph"
import { BackToPrev } from "../../../ui/BackToPrev"
import { Container } from "../../../ui/Container"
import { FormattedDate } from "../../../ui/FormattedDate"
import { PageNavigationAnimation } from "../../../ui/PageNavigationAnimation"
import { VaultGraphHost } from "../../../ui/VaultGraphHost"

const getVaultEntry = (slug: string) =>
  Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.findPublishedVaultBySlug(slug)
  })

const getVaultStaticParams = Effect.gen(function* () {
  const content: ContentService = yield* Content
  const entries: ReadonlyArray<VaultEntry> = yield* content.getPublishedVault()
  return entries.map((entry) => ({ slug: entry.slug }))
})

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(getVaultStaticParams)
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const entry: VaultEntry | undefined = await RuntimeServer.runPromise(getVaultEntry(slug))
  if (entry === undefined) {
    notFound()
  }

  return {
    title: entry.data.title,
    description: entry.data.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const entry: VaultEntry | undefined = await RuntimeServer.runPromise(getVaultEntry(slug))
  if (entry === undefined) {
    notFound()
  }

  const [{ snapshot }, selectedNodeId] = await Promise.all([
    getVaultGraphModel(),
    getSelectedVaultNodeId(entry.slug),
  ])

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="animate">
          <BackToPrev href="/vault">Back to vault</BackToPrev>
        </div>
        <div className="my-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)]">
          <div>
            <div className="animate mb-8">
              <div className="flex items-center gap-1.5 text-sm">
                <FormattedDate date={entry.data.updated} />
                <span>&bull;</span>
                <span>{readingTime(entry.source)}</span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-black dark:text-white">
                {entry.data.title}
              </h1>
              <p className="mt-2 text-black/70 dark:text-white/70">{entry.data.description}</p>
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
