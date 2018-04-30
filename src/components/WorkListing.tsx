import Link from "gatsby-link";
import * as React from "react";
import styled from "styled-components";

import { colorProp } from "../styles/themes";

interface Props {
  client: string;
  excerpt: string;
  slug: string;
  title: string;
}

export default ({ client, excerpt, slug, title }: Props) => (
  <Listing style={{ boxShadow: "none" }} to={slug}>
    <Header>
      <Title>{title}</Title>
      <SubTitle>{client}</SubTitle>
    </Header>
    <Excerpt dangerouslySetInnerHTML={{ __html: excerpt }} />
  </Listing>
);

const Listing = styled(Link)`
  box-shadow: none;
  text-decoration: none;
  border: 1px solid ${colorProp("greyLight")} !important;
  display: block;
  height: 100%;
  position: relative;
  width: 100%;

  :after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
    transition: opacity 0.3s ease-in-out;
  }

  :hover::after {
    opacity: 0;
  }
`;

const Header = styled.header`
  border-left: 4px solid rgba(0, 0, 0, 0.6);
  padding-left: 1rem;
`;

const Title = styled.h4`
  margin-bottom: 0;
`;

const SubTitle = styled.small`
  color: ${colorProp("greyLight")};
  display: block;
  font-style: italic;
  margin-bottom: 1rem;
`;

const Excerpt = styled.p`
  margin: 1rem;
`;
