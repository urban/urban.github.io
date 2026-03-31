import { Array, Effect, flow } from "effect"
import type { Metadata, ResolvingMetadata } from "next"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { Content } from "@/lib/services/Content"
import type { ContentService } from "@/lib/services/Content"
import { readingTime } from "@/lib/utils"
import { BackToPrev } from "@/ui/BackToPrev"
import { Container } from "@/ui/Container"
import { FormattedDate } from "@/ui/FormattedDate"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"

const main = (pathSlug: string) =>
  Effect.gen(function* () {
    const content: ContentService = yield* Content
    const essays = yield* content.getEssays()
    return yield* Array.findFirst(essays, ({ slug }) => slug === pathSlug)
    // return pipe(Effect.flatMap(Array.findFirst(({ slug }) => slug === pathSlug)))
  })

const mainAll = Effect.gen(function* () {
  const content: ContentService = yield* Content
  return yield* content.getEssays().pipe(
    Effect.map(
      flow(
        Array.filter(({ data }) => !data.draft),
        Array.map(({ slug }) => ({ slug })),
      ),
    ),
  )
})

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(mainAll)
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const essay = await RuntimeServer.runPromise(main(slug))

  return {
    title: essay.data.title,
    description: essay.data.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const essay = await RuntimeServer.runPromise(main(slug))

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="animate">
          <BackToPrev href="/essays">Back to essays</BackToPrev>
        </div>
        <div className="py-1 my-10">
          <div className="animate text-2xl font-semibold text-black dark:text-white">
            {essay.data.title}
          </div>
          <div className="animate flex items-center gap-1.5">
            <div className="font-base text-sm">
              <FormattedDate date={essay.data.date} />
            </div>
            &bull;
            <div className="font-base text-sm">{readingTime(essay.source)}</div>
          </div>
        </div>
        <article className="animate">
          <essay.Content />
        </article>
      </Container>
    </>
  )
}
