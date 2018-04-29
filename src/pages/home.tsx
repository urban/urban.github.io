import * as React from "react";
import Helmet from "react-helmet";
import styled from "styled-components";

interface Props {
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
  };
}

export default ({ data }: Props) => (
  <Container>
    <Helmet title={data.site.siteMetadata.title} />
    <Quote>
      <p>
        I love to work at the intersection between great technology, user
        experience and design. I can see the big picture and I care about the
        details. I can move fluidly between disciplines and I bridge the gap
        between design and implementation. Simply put, I like to take ideas and
        transform them into reality.
      </p>
      <p>– Urban</p>
    </Quote>
  </Container>
);

export const pageQuery = graphql`
  query HomeQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`;

const Container = styled.div`
  display: flex;
  flexDirection: column;
  justifyContent: center;
`;

const Quote = styled.blockquote`
  fontsize: "1.5rem";
`;
