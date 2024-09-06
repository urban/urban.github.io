import { Context, Layer } from "effect";
import { ARTICLE_PATH, getAllFromDir, getFromDir } from "../utils/mdxUtils";

export interface ContentService {
  readonly _: unique symbol;
}

const make = {
  getAllArticles: () => getAllFromDir(ARTICLE_PATH),
  getArticleBySlug: ({ slug }: { slug: string; }) => getFromDir(ARTICLE_PATH, slug),
};

type ContentServiceImpl = typeof make;

export const ContentService = Context.GenericTag<ContentServiceImpl>(
  "@app/ContentService"
);

export const ContentServiceLive = Layer.succeed(
  ContentService,
  ContentService.of(make)
);

