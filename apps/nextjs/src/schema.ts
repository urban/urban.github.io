import { Schema } from "effect";

export class FrontMatter extends Schema.Class<FrontMatter>("FrontMatter")({
  title: Schema.String,
  description: Schema.String,
}) {}

export class Article extends Schema.Class<Article>("Article")({
  slug: Schema.String,
  frontmatter: FrontMatter,
  source: Schema.String,
}) {
  static readonly Array = Schema.Array(this);
}
