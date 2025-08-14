import {
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Array, Effect, pipe, Record } from "effect";
import type { Metadata } from "next";
import { SITE, SOCIALS } from "@/lib/consts";
import { RuntimeServer } from "@/lib/RuntimeServer";
import { Content } from "@/lib/services/Content";
import { Container } from "@/ui/Container";
import { Link } from "@/ui/Link";
// import { ArrowCard } from "@/ui/ArrowCard";
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation";
import { PageTitle } from "@/ui/PageTitle";
import { WorkList } from "@/ui/WorkList";

const main = Effect.gen(function* () {
  const content = yield* Content;

  // const articles = yield* content.getArticles().pipe(
  //   Effect.map((articles) => articles.filter(({ data }) => !data.draft)),
  //   Effect.map(Array.take(SITE.numOfArticles)),
  // );
  // const projects = yield* content
  //   .getProjects()
  //   .pipe(Effect.map(Array.take(SITE.numOfProjects)));

  const work = yield* content.getWork().pipe(Effect.map(Array.take(SITE.numOfWork)));
  const groupedWork = pipe(
    work,
    Array.groupBy((x) => x.data.company),
    Record.values,
  );

  // return { articles, projects, work };
  return { work: groupedWork };
});

export const metadata: Metadata = {
  title: "Home",
  description: "Urban Faubion's personal website.",
};

export default async function Page() {
  // const { articles, projects, work } = await RuntimeServer.runPromise(main);
  const { work } = await RuntimeServer.runPromise(main);
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
                Hello, my name is Urban. I am a Senior Engineering Manager specializing in front-end
                development and design systems. I bridge design and engineering to build
                high-performing teams, modernize UI platforms, and foster clarity, trust, and
                collaboration. I&apos;m known for driving organizational change, elevating developer
                experience, and inspiring teams to deliver elegant, scalable solutions.
              </p>
              <p className="animate">
                <strong>Specialties</strong>: Software Engineering Management • Inclusive Team
                Leadership • Organizational Transformation • Front-end Development • UI Architecture
                • Design Systems • UX Design
              </p>
            </article>
          </section>

          {/*<section className="animate py-6">
            <div className="flex flex-wrap gap-y-2 items-center justify-between">
              <h5 className="font-semibold text-black dark:text-white">
                Latest articles
              </h5>
              <Link href="/articles">See all articles</Link>
            </div>
            <ul className="flex flex-col gap-4">
              {articles.map((article, idx) => (
                <li key={idx}>
                  <ArrowCard
                    metadata={article.data}
                    slug={article.slug}
                    collection="articles"
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
                  <Link href={SOCIAL.href} external aria-label={`${SITE.name} on ${SOCIAL.name}`}>
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
  );
}
