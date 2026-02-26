import { Array, Effect } from "effect"
import type { Metadata, ResolvingMetadata } from "next"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { Content } from "@/lib/services/Content"
import { readingTime } from "@/lib/utils"
import { BackToPrev } from "@/ui/BackToPrev"
import { Container } from "@/ui/Container"
import { FormattedDate } from "@/ui/FormattedDate"
import { Link } from "@/ui/Link"
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"

const main = (pathSlug: string) =>
  Effect.gen(function* () {
    const content = yield* Content
    const projects = yield* content.getProjects()
    return yield* Array.findFirst(projects, ({ slug }) => slug === pathSlug)
  })

const mainAll = Effect.gen(function* () {
  const content = yield* Content
  const allProjects = yield* content.getCollection("projects")
  return allProjects.map(({ slug }) => ({
    slug,
  }))
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
  const project = await RuntimeServer.runPromise(main(slug))

  return {
    title: project.data.title,
    description: project.data.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const project = await RuntimeServer.runPromise(main(slug))

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="animate">
          <BackToPrev href="/projects">Back to projects</BackToPrev>
        </div>
        <div className="py-1 my-10">
          <div className="animate flex items-center gap-1.5">
            <div className="font-base text-sm">
              <FormattedDate date={project.data.date} />
            </div>
            &bull;
            <div className="font-base text-sm">{readingTime(project.source)}</div>
          </div>
          <div className="animate text-2xl font-semibold text-black dark:text-white">
            {project.data.title}
          </div>
          {(project.data.demoURL || project.data.repoURL) && (
            <nav className="animate flex gap-1">
              {project.data.demoURL && (
                <Link href={project.data.demoURL} external>
                  demo
                </Link>
              )}
              {project.data.demoURL && project.data.repoURL && <span>/</span>}
              {project.data.repoURL && (
                <Link href={project.data.repoURL} external>
                  repo
                </Link>
              )}
            </nav>
          )}
        </div>
        <article className="animate">
          <project.Content />
        </article>
      </Container>
    </>
  )
}
