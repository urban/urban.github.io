import Link from "gatsby-link";
import { path } from "ramda";
import * as React from "react";
import Helmet from "react-helmet";
import styled from "styled-components";

import { H4 } from "../components/Headings";
import WorkListing from "../components/WorkListing";
import { MarkdownRemarkConnection } from "../graphql-types";
import { desktop, tablet } from "../styles/media";

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
  console.log(articles);
  return (
    <div>
      <Helmet title={data.site.siteMetadata.title} />
      <H4>Featured Work</H4>
      <Work>
        {Object.values(articles).map(({ node }) => {
          const props = {
            client: node.frontmatter.client,
            excerpt: node.excerpt,
            slug: node.fields.slug,
            title: path(["frontmatter", "title"], node) || node.fields.slug
          };
          return (
            <WorkItem key={props.slug}>
              <WorkListing {...props} />
            </WorkItem>
          );
        })}
      </Work>
    </div>
  );
};

const Work = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const WorkItem = styled.div`
  margin-bottom: 1rem;
  min-height: 18.75rem;
  width: 100%;

  @media ${tablet} {
    width: calc((99.9% - 1rem) / 2);
  }

  @media ${desktop} {
    width: calc((99.9% - 1rem * 2) / 3);
  }
`;

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { draft: { ne: true } }
        fileAbsolutePath: { regex: "/work/" }
      }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            client
            title
          }
        }
      }
    }
  }
`;
