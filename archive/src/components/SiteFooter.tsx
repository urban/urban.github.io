import * as React from "react";
import styled from "styled-components";

export default () => {
  const year = new Date().toLocaleDateString("en-US", { year: "numeric" });
  return (
    <Footer>
      <Container>
        <span>&copy; Urban Faubion {year}</span>
        <IconLink href="mailto:urban.faubion@gmail.com" target="_blank">
          <i className="icon-mail-alt" />
        </IconLink>
        <IconLink
          href="https://www.linkedin.com/in/urbanfaubion/"
          target="_blank"
        >
          <i className="icon-linkedin" />
        </IconLink>
        <IconLink href="https://github.com/urban" target="_blank">
          <i className="icon-github" />
        </IconLink>
      </Container>
    </Footer>
  );
};

const Footer = styled.footer`
  background-color: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.54);
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

const IconLink = styled.a`
  margin-left: 1rem;
  color: rgba(0, 0, 0, 0.2);

  :hover {
    border-bottom-color: transparent;
  }
`;
