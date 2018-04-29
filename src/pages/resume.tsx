import * as React from "react";
import Helmet from "react-helmet";
import styled from "styled-components";

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
      },
    };
  };
}

export default ({ data }: Props) => (
  <Container>
    <Helmet title={data.site.siteMetadata.title} />
    <h1>Resume</h1>
  </Container>
);

export const pageQuery = graphql`
  query ResumeQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
