import { Context, Effect, Layer, pipe } from "effect";
// import { Schema } from '@effect/schema';
import * as Fs from "fs";
import * as NodePath from "path";

// const getTableOfContents = (content: string) => {};
// const computeReadingTime = (content: string) => {};

type Frontmatter = {};
const parseFromFrontmatter = (content: string) => {};

const extractMetadata = ({ dir, file }: { dir: string; file: string }) =>
  Effect.gen(function* (_) {
    const filePath = NodePath.join(dir, file);
    const content = Fs.readFileSync(filePath, "utf-8");

    // 👇 Slug (from file name)
    const slug = NodePath.basename(file, NodePath.extname(file));

    // 👇 Metadata
    // const tableOfContents = getTableOfContents(content);
    // const readingTime = computeReadingTime(content);

    // 👇 Frontmatter
    // const { rawFrontmatter, rawSource: source } = parseFromFrontmatter(content);
    // const frontmatter = yield* _(
    //   rawFrontmatter,
    //   Schema.parseEither(Frontmatter),
    //   Effect.mapError(
    //     (error) => new ContentError({ reason: "frontmatter", error })
    //   )
    // );

    // return { slug, source, frontmatter, tableOfContents, readingTime };
    return { slug, content };
  });

const getAllFromDir = (...path: string[]) =>
  Effect.gen(function* (_) {
    const dir = NodePath.join(process.cwd(), ...path);
    console.log("dir", dir);
    const mdxFiles = Fs.readdirSync(dir).filter((file) =>
      NodePath.extname(file).match(/.mdx?/)
    );

    return Effect.succeed(mdxFiles);

    // const content = yield* _(
    //   Effect.all(mdxFiles.map((file) => extractMetadata({ dir, file }))),
    //   // { concurrency: "unbounded" }
    // );

    // return pipe(
    //   content
    //   // filterPublished,
    //   // sortByUpdatedDate
    // );
  });

export interface ContentService {
  readonly _: unique symbol;
}

const make = {
  getAllArticles: () => getAllFromDir("data", "articles"),
  getArticleBySlug: (slug: string) => {},
};

type ContentServiceImpl = typeof make;

export const ContentService = Context.GenericTag<ContentServiceImpl>(
  "@app/ContentService"
);

export const ContentServiceLive = Layer.succeed(
  ContentService,
  ContentService.of(make)
);
