import Link from "gatsby-link";
import * as React from "react";

import { MarkdownRemark } from "../graphql-types";

interface Props {
  next: false | MarkdownRemark;
  previous: false | MarkdownRemark;
}

export default ({ next, previous }: Props) => (
  <ul>
    {previous && (
      <li>
        <Link to={previous.fields.slug} rel="prev">
          ← {previous.frontmatter.title}
        </Link>
      </li>
    )}

    {next && (
      <li>
        <Link to={next.fields.slug} rel="next">
          {next.frontmatter.title} →
        </Link>
      </li>
    )}
  </ul>
);
