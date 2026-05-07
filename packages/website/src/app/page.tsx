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
        <PageTitle>Welcome</PageTitle>
        <div className="py-4">
          <section className="border-b border-gray-300 dark:border-gray-500">
            <article className="py-4">
              <p className="animate">
                Hello, my name is Urban. I’m a systems-oriented engineering leader focused on
                modernizing software delivery, product platforms, and design systems across
                startups, consulting environments, and large enterprise organizations. My work
                centers on building scalable technical systems that improve engineering velocity,
                maintainability, and delivery consistency, helping teams move faster and ship more
                reliably.
              </p>
              <p className="animate">
                I’ve helped organizations navigate major technology transitions spanning the early
                web, mobile, cloud platforms, design systems, and now AI-assisted software
                development. At Oracle, I led platform modernization initiatives across OCI and JET
                while remaining deeply hands-on in architecture, implementation, developer
                experience, and testing infrastructure. Earlier in my career at frog, I worked on
                everything from early enterprise design systems at GE to operating system prototypes
                and gesture-based interaction models for Nokia and Qualcomm during the early
                capacitive touchscreen era, as well as in-field research and mobile communication
                concepts for the Nike Foundation’s Girl Effect.
              </p>
              <p className="animate">
                My background spans engineering, architecture, design systems, and organizational
                transformation, with a consistent focus on reducing friction, accelerating
                iteration, and modernizing how teams build and ship software. More recently, I’ve
                been integrating AI-assisted workflows into prototyping, architecture exploration,
                development, and software delivery while maintaining high standards for technical
                quality and system design.
              </p>
              <p className="animate">
                <strong>Specialties</strong>: Product Platforms • Engineering Management • Software
                Development • Design Systems • AI-Assisted Software Delivery
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
