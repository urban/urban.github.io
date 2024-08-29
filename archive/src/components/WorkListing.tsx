import Img from "gatsby-image";
import Link from "gatsby-link";
import * as React from "react";
import styled from "styled-components";

import { colorProp } from "../styles/themes";

interface Props {
  client: string;
  color: string;
  image: any;
  slug: string;
  title: string;
}

export default ({ client, color, image, slug, title }: Props) => (
  <Listing to={slug}>
    <Header color={color}>
      <h4>{title}</h4>
      <small>{client}</small>
    </Header>
    <Img
      sizes={image.childImageSharp.sizes}
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    />
  </Listing>
);

const transitionDuration = "0.2s";

const Listing = styled(Link)`
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2) !important;
  text-decoration: none;
  border: none !important;
  box-shadow: none;
  display: block;
  height: 100%;
  position: relative;
  transition: box-shadow ${transitionDuration} ease-in-out,
    transform ${transitionDuration} ease-in-out;
  width: 100%;

  :hover {
    box-shadow: 0 0 4px rgb(2, 35, 67, 0.3) !important;
    transform: scale(0.98);
  }
`;

const Header = styled.header`
  border-left: 4px solid ${props => props.color};
  display: block;
  margin: 0 2rem 0 0;
  padding: 0.25rem 1rem;
  pointer-events: none;
  position: relative;
  top: 1rem;
  z-index: 1;

  & > h4 {
    margin: 0;
  }

  & > small {
    color: ${colorProp("greyLight")};
    display: block;
    font-style: italic;
    font-weight: 300;
    margin: 0;
  }
`;
