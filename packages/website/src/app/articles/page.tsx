import { Array, Effect, Order, pipe, Record } from "effect"
import type { Metadata } from "next"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { Content } from "@/lib/services/Content"
import { ArrowCard } from "@/ui/ArrowCard"
import { Container } from "@/ui/Container"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"

const main = Effect.gen(function* () {
  const content = yield* Content
  const allArticles = yield* content.getArticles()
  const articlesMetadata = allArticles.map(({ data, slug }) => ({
    metadata: data,
    slug,
  }))

  const articles = pipe(
    articlesMetadata,
    Array.filter(({ metadata }) => !metadata.draft),
    Array.sortBy(Order.reverse(Order.mapInput(Order.Date, ({ metadata }) => metadata.updatedAt))),
    Array.groupBy(({ metadata }) => metadata.date.getFullYear().toString()),
  )

  const years = pipe(
    articles,
    Record.keys,
    Array.sortBy(Order.reverse(Order.mapInput(Order.number, (a) => parseInt(a)))),
  )

  return { articles, years }
})

export const metadata: Metadata = {
  title: "Articles",
  description: "A collection of articles on topics I am passionate about.",
}

export default async function Page() {
  const { articles, years } = await RuntimeServer.runPromise(main)
  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="py-10">
          <div className="animate font-semibold text-black dark:text-white">Articles</div>
          <div className="space-y-4">
            {years.map((year) => (
              <section key={year} className="animate py-4">
                <div className="font-semibold text-black dark:text-white">{year}</div>
                <div>
                  <ul className="flex flex-col gap-4">
                    {articles[year]?.map((article, idx) => (
                      <li key={idx}>
                        <ArrowCard
                          metadata={article.metadata}
                          slug={article.slug}
                          collection="articles"
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
