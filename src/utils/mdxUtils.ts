import { Effect, pipe, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import matter from "gray-matter";
import { FrontMatter } from "#services/schema";
import { NodeContext } from "@effect/platform-node";
import { Slug } from "#services/Slug";

const parseFrontmatter = (content: string) => {
  const { content: rawSource, data: rawFrontmatter } = matter(content);
  return { rawFrontmatter, rawSource };
};
// const getTableOfContents = (content: string) => {};
// const computeReadingTime = (content: string) => {};

// class FileSystemError extends Data.Error<{ message: string}> {};

export const extractMetadata = (filePath: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const content = yield* fs.readFileString(filePath, 'utf-8');
    

    // 👇 Slug (from file name)
    const slug = (yield* Slug).decode(filePath);

    // 👇 Metadata
    // const tableOfContents = getTableOfContents(content);
    // const readingTime = computeReadingTime(content);

    // 👇 Frontmatter
    const { rawFrontmatter, rawSource: source } = parseFrontmatter(content);

    const frontmatter = yield* pipe(
      rawFrontmatter,
      Schema.decodeUnknown(FrontMatter)
    );

    // return { slug, source, frontmatter, tableOfContents, readingTime };
    return { slug, frontmatter, source };
  }).pipe(
    Effect.provide(NodeContext.layer),
    Effect.provide(Slug.Live)
  );
