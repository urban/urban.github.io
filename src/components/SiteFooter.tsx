import * as React from "react";
import styled from "styled-components";

export default () => {
  const year = new Date().toLocaleDateString("en-US", { year: "numeric" });
  return (
    <Footer>
      <Container>
        <span>&copy; Urban Faubion {year}</span>
      </Container>
    </Footer>
  );
};

const Footer = styled.footer`
  background-color: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.75rem;
  padding: 1em 0;
`;

const Container = styled.div`
  margin-right: auto;
  margin-left: auto;
  padding: 0 1.25rem;
  max-width: calc(960px - (1.25rem * 2));
  padding: 0 1rem;
`;
