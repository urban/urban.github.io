import { Array, Effect, flow } from "effect";
import type { Metadata, ResolvingMetadata } from "next";
import { RuntimeServer } from "@/lib/RuntimeServer";
import { Content } from "@/lib/services/Content";
import { readingTime } from "@/lib/utils";
import { BackToPrev } from "@/ui/BackToPrev";
import { Container } from "@/ui/Container";
import { FormattedDate } from "@/ui/FormattedDate";
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation";

const main = (pathSlug: string) =>
  Effect.gen(function* () {
    const content = yield* Content;
    return yield* content
      .getArticles()
      .pipe(Effect.flatMap(Array.findFirst(({ slug }) => slug === pathSlug)));
  });

const mainAll = Effect.gen(function* () {
  const content = yield* Content;
  return yield* content.getArticles().pipe(
    Effect.map(
      flow(
        Array.filter(({ data }) => !data.draft),
        Array.map(({ slug }) => ({ slug })),
      ),
    ),
  );
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return await RuntimeServer.runPromise(mainAll);
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const article = await RuntimeServer.runPromise(main(slug));

  return {
    title: article.data.title,
    description: article.data.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const article = await RuntimeServer.runPromise(main(slug));

  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="animate">
          <BackToPrev href="/blog">Back to articles</BackToPrev>
        </div>
        <div className="py-1 my-10">
          <div className="animate flex items-center gap-1.5">
            <div className="font-base text-sm">
              <FormattedDate date={article.data.date} />
            </div>
            &bull;
            <div className="font-base text-sm">{readingTime(article.source)}</div>
          </div>
          <div className="animate text-2xl font-semibold text-black dark:text-white">
            {article.data.title}
          </div>
        </div>
        <article className="animate">
          <article.Content />
        </article>
      </Container>
    </>
  );
}
