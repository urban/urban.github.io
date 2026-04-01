import type { Metadata as NextMetadata } from "next"
import { Container } from "@/ui/Container"
import { Array, Effect, flow, Order } from "effect"
import { Content } from "@/lib/services/Content"
import type { ContentService } from "@/lib/services/Content"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { ArrowCard } from "@/ui/ArrowCard"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"
import { ComingSoon } from "@/ui/ComingSoon"

const main = Effect.gen(function* () {
  const content: ContentService = yield* Content
  return yield* content.getProjects().pipe(
    Effect.map(
      flow(
        Array.filter(({ data }) => !data.draft),
        Array.sortBy(Order.flip(Order.mapInput(Order.Date, ({ data }) => data.date))),
      ),
    ),
  )
})

export const metadata: NextMetadata = {
  title: "Projects",
  description: "A collection of my projects, with links to repositories and demos.",
}

export default async function Page() {
  const projects = await RuntimeServer.runPromise(main)
  const hasProjects = projects.length !== 0
  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="py-10">
          <div className="animate">
            <h1 className="my-2 text-2xl font-semibold text-black dark:text-white">Projects</h1>
          </div>
          <ul className="animate flex flex-col gap-4">
            {!hasProjects && <ComingSoon />}
            {projects.map(({ data, slug }) => (
              <li key={slug}>
                <ArrowCard collection="projects" metadata={data} slug={slug} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </>
  )
}
