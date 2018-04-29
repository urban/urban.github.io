import Link from "gatsby-link";
import { path } from "ramda";
import * as React from "react";
import Helmet from "react-helmet";

import { MarkdownRemarkConnection } from "../graphql-types";

interface Props {
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
    allMarkdownRemark: MarkdownRemarkConnection;
  };
}

export default ({ data }: Props) => {
  const posts = path(["allMarkdownRemark", "edges"], data);

  return (
    <div>
      <Helmet title={data.site.siteMetadata.title} />
      <h1>Articles</h1>
      {Object.values(posts).map(({ node }) => {
        const title = path(["frontmatter", "title"], node) || node.fields.slug;
        return (
          <div key={node.fields.slug}>
            <h3>
              <Link style={{ boxShadow: "none" }} to={node.fields.slug}>
                {title}
              </Link>
            </h3>
            <small>{node.frontmatter.date}</small>
            <p dangerouslySetInnerHTML={{ __html: node.excerpt }} />
          </div>
        );
      })}
    </div>
  );
};

export const pageQuery = graphql`
  query ArticlesQuery {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "DD MMMM, YYYY")
            title
          }
        }
      }
    }
  }
`;
