import * as React from "react";
import Helmet from "react-helmet";
import styled from "styled-components";

import { MarkdownRemark } from "../graphql-types";
import { desktop, tablet } from "../styles/media";
import { colorProp } from "../styles/themes";

require("./resume.css");

const Container = styled.div`
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  height: "100%",
  position: "absolute",
`;

interface Props {
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
    markdownRemark: MarkdownRemark;
  };
}

export default ({ data }: Props) => (
  <Container>
    <Helmet title={data.site.siteMetadata.title} />
    <Page
      className="resume"
      dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }}
    />
    <p>
      <strong>Download As:</strong>{" "}
      <a href="/Resume-UrbanFaubion.pdf" target="_blank">
        PDF
      </a>
      {", "}
      <a href="/Resume-UrbanFaubion.rtf">RTF</a>
    </p>
  </Container>
);

export const pageQuery = graphql`
  query ResumeQuery {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark {
      html
      frontmatter {
        title
      }
    }
  }
`;

const Page = styled.article`
  border: 1px solid ${colorProp("light")};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 0, 0, 0.03);
  margin-bottom: 2rem;
  padding: 2rem;

  @media ${desktop}, ${tablet} {
    padding: 5rem;
  }
`;
