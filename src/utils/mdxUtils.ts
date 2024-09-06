
import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import matter from 'gray-matter';
import * as Fs from "fs";
import * as NodePath from "path";

export const ARTICLE_PATH = NodePath.join(process.cwd(), "data", "articles")

const FrontMatter = Schema.Struct({
  title: Schema.String,
  description: Schema.String
});

type FrontMatter = Schema.Schema.Type<typeof FrontMatter>;

const parseFrontmatter = (content: string) => {
  const { content:rawSource, data: rawFrontmatter } = matter(content);
  return { rawFrontmatter, rawSource };
};
// const getTableOfContents = (content: string) => {};
// const computeReadingTime = (content: string) => {};

const readFileSync = (filePath: string) =>
    Effect.try({
      try: () => Fs.readFileSync(filePath, "utf-8"),
      catch: (unknown) => new Error(`no such file or directory, open ${filePath}`)
    });

const extractMetadata = ({ dir, file }: { dir: string; file: string }) =>
  Effect.gen(function* () {
    const filePath = NodePath.join(dir, file);
    // TODO: Handle Error: ENOENT: no such file or directory, open 
    const content = Fs.readFileSync(filePath, "utf-8");
    // const content = readFileSync(filePath);

    // 👇 Slug (from file name)
    const slug = NodePath.basename(file, NodePath.extname(file));

    // 👇 Metadata
    // const tableOfContents = getTableOfContents(content);
    // const readingTime = computeReadingTime(content);

    // 👇 Frontmatter
    const { rawFrontmatter, rawSource: source } = parseFrontmatter(content);
    // const { rawFrontmatter, rawSource: source } = yield* _(content, Effect.map(parseFrontmatter));
    // console.log(rawFrontmatter);
    const frontmatter = yield* pipe(
      rawFrontmatter,
      Schema.decodeUnknown(FrontMatter),
      // Effect.mapError(
      //   (error) => new ContentError({ reason: "frontmatter", error })
      // )
    );

    // return { slug, source, frontmatter, tableOfContents, readingTime };
    return { slug, frontmatter, source };
  });

export const getAllFromDir = (dir: string) =>
  Effect.gen(function* () {
    const mdxFiles = Fs.readdirSync(dir).filter((file) =>
      NodePath.extname(file).match(/.mdx?/)
    );

    const content = yield* Effect.all(mdxFiles.map((file) => extractMetadata({ dir, file })));

    return pipe(
      content
      // filterPublished,
      // sortByUpdatedDate
    );
  });

  export const getFromDir = (dir:string, file:string) =>
    Effect.gen(function* () {
      const content = yield* extractMetadata({ dir, file: `${file}.md` });

      return pipe(
        content
      )
    })
