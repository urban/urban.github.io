import { Schema } from "effect";

// export const FrontMatter = Schema.Struct({
//   title: Schema.String,
//   description: Schema.String,
// });

// type FrontMatter = Schema.Schema.Type<typeof FrontMatter>;

export class FrontMatter extends Schema.Class<FrontMatter>("FrontMatter")({
  title: Schema.String,
  description: Schema.String,
}) {}

export class Article extends Schema.Class<Article>("Article")({
  slug: Schema.String,
  frontmatter: FrontMatter,
}) {
  static readonly Array = Schema.Array(this);
}
