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

  return (
    <div>
      <Helmet title={data.site.siteMetadata.title} />
      <H4>Featured Work</H4>
      <Work>
        {Object.values(articles).map(({ node }) => {
          const props = {
            client: node.frontmatter.client,
            color: node.frontmatter.color,
            image: node.frontmatter.listingImage,
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
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: -1rem 0 0 -1rem;
`;

const WorkItem = styled.div`
  margin: 1rem 0 0 1rem;
  min-height: 18.75rem;
  width: 100%;

  @media ${tablet} {
    width: calc((99.9% - 2rem) / 2);
  }

  @media ${desktop} {
    width: calc((99.9% - 4rem) / 3);
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
            color
            client
            title
            listingImage {
              childImageSharp {
                sizes(maxWidth: 642) {
                  ...GatsbyImageSharpSizes
                }
              }
            }
          }
        }
      }
    }
  }
`;
