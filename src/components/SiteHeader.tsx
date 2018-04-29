import Link from "gatsby-link";
import * as React from "react";
import styled from "styled-components";

import { colorProp } from "../styles/themes";

interface Props {
  location: {
    pathname: string;
  };
}

export default ({ location }: Props) => (
  <Header>
    <Container>
      <Logo href="/">
        <Title>Urban Faubion</Title>
        <SubTitle>Design Technologist</SubTitle>
      </Logo>
      <Nav>
        <NavLink to="/">
          Portfolio
        </NavLink>
        <NavLink to="/resume">
          Resume
        </NavLink>
        <StyledLink href="mailto:urban@urbanfaubion.com">
          Contact
        </StyledLink>
      </Nav>
    </Container>
  </Header>
);

const Header = styled.header`
`;

const Container = styled.div`
  align-content: center;
  align-items: baseline;
  display: flex;
  height: calc(6 * 1rem);
  justify-content: space-between;
  margin-right: auto;
  margin-left: auto;
  max-width: calc(960px - (1.25rem * 2));
  padding: 1rem;
  width: 100%;
`;

const Logo = styled.a``;

const Title = styled.h1`
  display: inline-block;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;

  :after {
    color: ${colorProp("grey")};
    content: "/";
    font-size: 1em;
    font-weight: normal;
    margin: 0 .5em;
  }
`;

const SubTitle = styled.h2`
  color: ${colorProp("grey")};
  display: inline-block;
  font-size: 1.2rem;
  font-weight: 400;
  margin: 0;
  white-space: nowrap;
`;

const Nav = styled.nav`
  align-content: center;
  align-items: baseline;
  display: flex;
  justify-content: space-between;
`;

const NavLink = styled(Link)`
  color: ${colorProp("dark")};
  margin-left: 1rem;

  :hover {
    border-bottom: 1px solid;
  }
`;

const StyledLink = styled.a`
  color: ${colorProp("dark")};
  margin-left: 1rem;

  :hover {
    border-bottom: 1px solid;
  }
`;
