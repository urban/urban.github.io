import { Effect } from "effect"
import { notFound } from "next/navigation"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { Content } from "@/lib/services/Content"
import type { ContentService, NoteEntry } from "@/lib/services/Content"
// import { readingTime } from "@/lib/utils"
import {
  getSelectedNodeId as getSelectedGardenNodeId,
  getBacklinks as getGardenBacklinks,
  getGraphModel as getGardenGraphModel,
} from "@/lib/noteGraph"
import { BackToPrev } from "@/ui/BackToPrev"
import { Container } from "@/ui/Container"
// import { FormattedDate } from "@/ui/FormattedDate"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"
import { GraphHost } from "@/ui/GraphHost"
import { Backlinks } from "@/ui/Backlinks"

export const getGardenEntry = (slug: string) =>
  Effect.gen(function* () {
    const content: ContentService = yield* Content
    return yield* content.findPublishedNotesBySlug(slug)
  })

export const getGardenStaticParams = Effect.gen(function* () {
  const content: ContentService = yield* Content
  const entries: ReadonlyArray<NoteEntry> = yield* content.getPublishedNotes()
  return entries.filter((entry) => entry.slug !== "index").map((entry) => ({ slug: entry.slug }))
})

export const getRequiredGardenEntry = async (slug: string): Promise<NoteEntry> => {
  const entry: NoteEntry | undefined = await RuntimeServer.runPromise(getGardenEntry(slug))
  if (entry === undefined) {
    notFound()
  }

  return entry
}

type GardenEntryPageProps = {
  readonly entry: NoteEntry
  readonly showBackTo?: boolean
}

export async function GardenEntryPage({ entry, showBackTo = false }: GardenEntryPageProps) {
  const [{ snapshot }, selectedNodeId] = await Promise.all([
    getGardenGraphModel(),
    getSelectedGardenNodeId(entry.slug),
  ])
  const backlinks = getGardenBacklinks(snapshot, selectedNodeId)

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        {showBackTo ? (
          <div className="animate">
            <BackToPrev href="/garden">Back to The Garden</BackToPrev>
          </div>
        ) : null}
        <div className="my-10 flex flex-col gap-10">
          <div className="max-w-3xl">
            <div className="animate mb-8">
              <h1 className="my-2 text-2xl font-semibold text-black dark:text-white">
                {entry.data.title}
              </h1>
              {/*<div className="flex items-center gap-1.5 text-sm">
                <FormattedDate date={entry.data.updatedAt} />
                <span>&bull;</span>
                <span>{readingTime(entry.source)}</span>
              </div>*/}
            </div>
            <article className="animate">
              <entry.Content />
            </article>
          </div>
          <div className="animate">
            <GraphHost
              snapshot={snapshot}
              selectedNodeId={selectedNodeId}
              scrollZoomEnabled={false}
            />
          </div>
          <section className="animate">
            <Backlinks backlinks={backlinks} />
          </section>
        </div>
      </Container>
    </>
  )
}
