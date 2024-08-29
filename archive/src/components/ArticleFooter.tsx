import Link from "gatsby-link";
import * as React from "react";
import styled from "styled-components";

import { desktop, tablet } from "../styles/media";
import { colorProp } from "../styles/themes";
import { H6 } from "./Headings";
import { GitHub, Twitter } from "./Icons";

import profilePic = require("./profile-pic.jpg");

export default () => (
  <Footer>
    <H6>About the Author</H6>
    <Container>
      <Avatar />
      <div>
        <Name>Urban Faubion</Name>
        <P>
          Urban is a designer and developer with a love for creating digital
          products and services. He has a broad range of professional expertise
          in design, design research, interaction and user experience design,
          user interface development, software engineering and prototyping. He
          also enjoys playing soccer, bike touring, rock climbing, teaching
          mountaineering and traveling as much as possible.
        </P>
        <SocialLink href="https://github.com/urban">
          <GitHub />
        </SocialLink>
        <span style={{ padding: "0.5rem" }} />
        <SocialLink href="https://twitter.com/urbanfaubion">
          <Twitter />
        </SocialLink>
      </div>
    </Container>
  </Footer>
);

const Footer = styled.footer`
  border-top: 1px solid ${colorProp("greyLight")};
  padding-bottom: 2rem;
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

const Avatar = styled.div`
  background: url(${profilePic}) no-repeat center center;
  background-size: cover;
  border: 1px solid ${colorProp("grey")};
  border-radius: calc(12 * 8px);
  display: none;
  flex: none;
  height: calc(12 * 8px);
  margin: 0.5rem 2rem 0 0;
  width: calc(12 * 8px);

  @media ${desktop}, ${tablet} {
    display: block;
  }
`;

const Name = styled.h3`
  margin: 0 0 0.5rem 0;
`;

const P = styled.p`
  :last-child {
    margin: 0;
  }
`;

const SocialLink = styled.a`
  :hover {
    fill: ${colorProp("info")};
  }
`;
