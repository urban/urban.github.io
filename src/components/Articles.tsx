import type { Article as Schema } from "#schema";
import Link from "next/link";

const Articles = ({ articles }: { articles: readonly Schema[] }) => {
  return (
    <div>
      <ul>
        {/* Render 'articles' */}
        {articles.map(({ slug, frontmatter }, idx) => (
          <li key={idx}>
            <Link as={`/articles/${slug}`} href={`/articles/[slug]`}>
              {frontmatter.title}
            </Link>
          </li>
        ))}
        <li>
          <Link as={`/articles/foobar`} href={`/articles/[slug]`}>
            Foo Bar
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Articles;
