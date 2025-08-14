import type { Metadata } from "next";
import { Container } from "@/ui/Container";
import { Array, Effect, pipe, Record } from "effect";
import { Content } from "@/lib/services/Content";
import { RuntimeServer } from "@/lib/RuntimeServer";
import { PageNavigationAnimation } from "@/ui/PageNavigationAnimation";
import { PageTitle } from "@/ui/PageTitle";
import { WorkList } from "@/ui/WorkList";

const main = Effect.gen(function* () {
  const content = yield* Content;
  const work = yield* content.getWork();
  const groupedWork = pipe(
    work,
    Array.groupBy((x) => x.data.company),
    Record.values,
  );
  return groupedWork;
});

export const metadata: Metadata = {
  title: "Work",
  description: "Where I have worked and what I have done.",
};

export default async function Page() {
  const work = await RuntimeServer.runPromise(main);
  return (
    <>
      <PageNavigationAnimation />
      <Container>
        <div className="py-10">
          <PageTitle>Work</PageTitle>
          <WorkList work={work} />
        </div>
      </Container>
    </>
  );
}
