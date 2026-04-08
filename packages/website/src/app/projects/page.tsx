import type { Metadata as NextMetadata } from "next"
import { Array, DateTime, Effect, flow, Order } from "effect"
import { Content } from "@/lib/services/Content"
import type { ContentService } from "@/lib/services/Content"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { ComingSoon } from "@/ui/ComingSoon"
import { Container } from "@/ui/Container"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"

const main = Effect.gen(function* () {
  const content: ContentService = yield* Content
  return yield* content.getProjects().pipe(
    Effect.map(
      flow(
        Array.filter(({ data }) => data.published ?? true),
        Array.sortBy(Order.flip(Order.mapInput(DateTime.Order, ({ data }) => data.updatedAt))),
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
                <a
                  href={data.repoURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group flex flex-nowrap py-3 px-4 pr-10 rounded-lg border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors duration-300 ease-in-out"
                >
                  <div className="flex flex-col flex-1 truncate">
                    <div className="font-semibold">{data.title}</div>
                    <div className="text-sm">{data.description}</div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="absolute top-1/2 right-2 -translate-y-1/2 size-5 stroke-2 fill-none stroke-current"
                  >
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                      className="translate-x-3 group-hover:translate-x-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"
                    />
                    <polyline
                      points="12 5 19 12 12 19"
                      className="-translate-x-1 group-hover:translate-x-0 transition-transform duration-300 ease-in-out"
                    />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </>
  )
}
