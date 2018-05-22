import Link from "gatsby-link";
import { path } from "ramda";
import * as React from "react";
import Helmet from "react-helmet";

import ArticleFooter from "../components/ArticleFooter";
// import ArticleNav from "../components/ArticleNav";
import PageTitle from "../components/PageTitle";
import { MarkdownRemark, SitePageEdge } from "../graphql-types";

require("./article.css"); // tslint:disable-line

interface Props {
  pathContext: {
    next: false | MarkdownRemark;
    previous: false | MarkdownRemark;
  };
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
    allSitePage: {
      edges: SitePageEdge;
    };
    markdownRemark: MarkdownRemark;
  };
}

const siteTitle = path(["site", "siteMetadata", "title"]);

export default ({ data, pathContext }: Props) => {
  if (!data) {
    return null;
  }
  const { frontmatter, html } = data.markdownRemark;
  const { previous, next } = pathContext;

  return (
    <div>
      <Helmet title={`${frontmatter.title} | ${siteTitle(data)}`} />
      <PageTitle title={frontmatter.title} subTitle={frontmatter.date} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {/* <ArticleFooter {...pathContext} /> */}
      <ArticleFooter />
    </div>
  );
};

export const pageQuery = graphql`
  query ArticleByPath($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`;
