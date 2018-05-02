import Link from "gatsby-link";
import { path } from "ramda";
import * as React from "react";
import Helmet from "react-helmet";
import styled from "styled-components";

// import ArticleNav from "../components/ArticleNav";
import PageTitle from "../components/PageTitle";
import { MarkdownRemark, SitePageEdge } from "../graphql-types";

require("./work.css");

interface Props {
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

export default ({ data }: Props) => {
  if (!data) {
    return null;
  }

  const { frontmatter, html } = data.markdownRemark;

  return (
    <div>
      <Helmet title={`${frontmatter.title} | ${siteTitle(data)}`} />
      <PageTitle title={frontmatter.title} subTitle={frontmatter.client} />
      <div className="work" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export const pageQuery = graphql`
  query WorkByPath($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      frontmatter {
        title
        client
      }
    }
  }
`;

const PublishDate = styled.span``;
