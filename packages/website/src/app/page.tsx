import {
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Array, Effect, pipe, Record } from "effect"
import type { Metadata } from "next"
import { SITE, SOCIALS } from "@/lib/consts"
import { RuntimeServer } from "@/lib/RuntimeServer"
import { Content } from "@/lib/services/Content"
import type { ContentService } from "@/lib/services/Content"
import { Container } from "@/ui/Container"
import { Link } from "@/ui/NavLink"
// import { ArrowCard } from "@/ui/ArrowCard";
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation"
import { PageTitle } from "@/ui/PageTitle"
import { WorkList } from "@/ui/WorkList"

const main = Effect.gen(function* () {
  const content: ContentService = yield* Content

  // const essays = yield* content.getEssays.pipe(
  //   Effect.map((essays) => essays.filter(({ data }) => !data.draft)),
  //   Effect.map(Array.take(SITE.numOfEssays)),
  // );
  // const projects = yield* content
  //   .getProjects()
  //   .pipe(Effect.map(Array.take(SITE.numOfProjects)));

  const work = yield* content.getWork.pipe(Effect.map(Array.take(SITE.numOfWork)))
  const groupedWork = pipe(
    work,
    Array.groupBy((x) => x.data.company),
    Record.values,
  )

  // return { essays, projects, work };
  return { work: groupedWork }
})

export const metadata: Metadata = {
  title: "Home",
  description: "Urban Faubion's personal website.",
}

export default async function Page() {
  // const { essays, projects, work } = await RuntimeServer.runPromise(main);
  const { work } = await RuntimeServer.runPromise(main)
  return (
    <>
      <PageNavigationAnimation />
      <Container>
        {/*<PageTitle>
          Urban
          <br />
          Faubion
        </PageTitle>*/}
        <PageTitle>Hello,</PageTitle>
        <div>
          <section className="mb-8 border-b border-gray-300 dark:border-gray-500">
            <article className="py-4">
              <p className="animate">
                <b>I’m Urban.</b> I build software, design systems, and tools that make developers’ lives easier.
              </p>
              <p className="animate">
                I’ve spent my career connecting design and engineering, building platforms, and leading teams. These days, I’m exploring how AI can improve the way we build software.
              </p>
            </article>
          </section>

          {/*<section className="animate py-6">
            <div className="flex flex-wrap gap-y-2 items-center justify-between">
              <h5 className="font-semibold text-black dark:text-white">
                Latest essays
              </h5>
              <Link href="/essays">See all essays</Link>
            </div>
            <ul className="flex flex-col gap-4">
              {essays.map((essay, idx) => (
                <li key={idx}>
                  <ArrowCard
                    metadata={essay.data}
                    slug={essay.slug}
                    collection="essays"
                  />
                </li>
              ))}
            </ul>
          </section>*/}

          {/*
          <section className="animate py-6">
            <div className="flex flex-wrap gap-y-2 items-center justify-between">
              <h5 className="font-semibold text-black dark:text-white">Work Experience</h5>
              <Link href="/work">See all work</Link>
            </div>
            <WorkList work={work} />
          </section>
           */}

          <section className="animate w-0y-4">
            <h5 className="font-semibold text-black dark:text-white">Let&apos;s Connect</h5>
            <article>
              <p>
                If you want to get in touch with me about something or just to say hi, reach out on
                social media or send me an email.
              </p>
            </article>
            <ul className="flex flex-wrap gap-2">
              {SOCIALS.map((SOCIAL) => (
                <li key={SOCIAL.name} className="flex gap-x-2 text-nowrap items-center">
                  <Link href={SOCIAL.href} aria-label={`${SITE.name} on ${SOCIAL.name}`}>
                    {
                      {
                        github: <GithubLogoIcon size={21} />,
                        linkedin: <LinkedinLogoIcon size={21} />,
                        "twitter-x": <XLogoIcon size={21} />,
                      }[SOCIAL.name]
                    }
                  </Link>
                  {"/"}
                </li>
              ))}
              <li className="flex gap-x-2 text-nowrap items-center">
                <Link href={`mailto:${SITE.email}`} aria-label={`Email ${SITE.name}`}>
                  <EnvelopeSimpleIcon size={21} />
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </Container>
    </>
  )
}
