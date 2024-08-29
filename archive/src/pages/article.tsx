import Link from "gatsby-link";
import { path } from "ramda";
import * as React from "react";
import Helmet from "react-helmet";

import ArticleListing from "../components/ArticleListing";
import { H4 } from "../components/Headings";
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
  const articles = path(["allMarkdownRemark", "edges"], data);
  return (
    <div>
      <Helmet title={data.site.siteMetadata.title} />
      <H4>Articles</H4>
      {Object.values(articles).map(({ node }) => {
        const props = {
          date: node.frontmatter.date,
          excerpt: node.excerpt,
          slug: node.fields.slug,
          title: path(["frontmatter", "title"], node) || node.fields.slug
        };
        return <ArticleListing key={props.slug} {...props} />;
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
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { draft: { ne: true } }
        fileAbsolutePath: { regex: "/article/" }
      }
    ) {
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
