import { Array, Effect, Order, pipe, Record } from "effect"
import type { Metadata } from "next"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { Content } from "@/lib/services/Content"
import type { ContentService } from "@/lib/services/Content"
import { ArrowCard } from "@/ui/ArrowCard"
import { Container } from "@/ui/Container"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"
import { ComingSoon } from "@/ui/ComingSoon"

const main = Effect.gen(function* () {
  const content: ContentService = yield* Content
  const allEssays = yield* content.getEssays()
  const essaysMetadata = allEssays.map(({ data, slug }) => ({
    metadata: data,
    slug,
  }))

  const essays = pipe(
    essaysMetadata,
    Array.filter(({ metadata }) => !metadata.draft),
    Array.sortBy(Order.flip(Order.mapInput(Order.Date, ({ metadata }) => metadata.updatedAt))),
    Array.groupBy(({ metadata }) => metadata.date.getFullYear().toString()),
  )

  const years = pipe(
    essays,
    Record.keys,
    Array.sortBy(Order.flip(Order.mapInput(Order.Number, (a) => parseInt(a)))),
  )

  return { essays, years }
})

export const metadata: Metadata = {
  title: "Essays",
  description: "A collection of essays on topics I am passionate about.",
}

export default async function Page() {
  const { essays, years } = await RuntimeServer.runPromise(main)
  const hasEssays = Object.values(essays).length !== 0
  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="py-10">
          <div className="animate font-semibold text-black dark:text-white">Essays</div>
          <div className="space-y-4">
            {!hasEssays && <ComingSoon />}
            {years.map((year) => (
              <section key={year} className="animate py-4">
                <div className="font-semibold text-black dark:text-white">{year}</div>
                <div>
                  <ul className="flex flex-col gap-4">
                    {essays[year]?.map((essay, idx) => (
                      <li key={idx}>
                        <ArrowCard
                          metadata={essay.metadata}
                          slug={essay.slug}
                          collection="essays"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  )
}
