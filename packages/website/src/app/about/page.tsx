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

  // const essays = yield* content.getEssays().pipe(
  //   Effect.map((essays) => essays.filter(({ data }) => !data.draft)),
  //   Effect.map(Array.take(SITE.numOfEssays)),
  // );
  // const projects = yield* content
  //   .getProjects()
  //   .pipe(Effect.map(Array.take(SITE.numOfProjects)));

  const work = yield* content.getWork().pipe(Effect.map(Array.take(SITE.numOfWork)))
  const groupedWork = pipe(
    work,
    Array.groupBy((x) => x.data.company),
    Record.values,
  )

  // return { essays, projects, work };
  return { work: groupedWork }
})

export const metadata: Metadata = {
  title: "About",
  description: "Urban Faubion's personal website.",
}

export default async function Page() {
  // const { essays, projects, work } = await RuntimeServer.runPromise(main);
  const { work } = await RuntimeServer.runPromise(main)
  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <PageTitle>
          Urban
          <br />
          Faubion
        </PageTitle>
        <div className="py-4">
          <section className="border-b border-gray-300 dark:border-gray-500">
            <article className="py-4">
              <p className="animate">
                Hello, my name is Urban. I am a Software Engineer and Engineering Manager with deep
                experience owning and evolving platforms, design systems, and shared infrastructure
                that helps product teams move faster while delivering higher-quality products at
                scale. I take responsibility for ambiguous, high impact problems that sit at the
                intersection of product, design, and engineering, and I turn them into durable
                systems that scale. My work has included leading major platform migrations, defining
                quality standards, and building shared infrastructure that improves consistency,
                performance, and reliability.
              </p>
              <p className="animate">
                I’ve led platform modernization efforts, shaped frontend architecture, established
                quality and accessibility standards, and built shared foundations that help teams
                move faster with more confidence. A big part of my work has been creating alignment
                across functions by translating user and business needs into clear technical
                direction and helping teams navigate tradeoffs in ambiguous environments.
              </p>
              <p className="animate">
                I’ve worked as both an IC and an engineering manager, but the work I value most is
                hands-on technical leadership. I’m focused on roles where I can combine technical
                depth, systems thinking, and cross-functional leadership while continuing to grow
                into full-stack systems, AI tooling, and agent-oriented development.
              </p>
              <p className="animate">
                <strong>Specialties</strong>: Engineering Management • Software Development •
                Front-end Development • User Experience (UX) • Design Systems
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

          <section className="animate py-6">
            <div className="flex flex-wrap gap-y-2 items-center justify-between">
              <h5 className="font-semibold text-black dark:text-white">Work Experience</h5>
              <Link href="/work">See all work</Link>
            </div>
            <WorkList work={work} />
          </section>

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
