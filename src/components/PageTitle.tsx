import * as React from "react";
import styled from "styled-components";

import { colorProp } from "../styles/themes";

interface Props {
  title: string;
  subTitle: string;
}

export default ({ title, subTitle }: Props) => (
  <Title>
    {title}
    <SubTitle>{subTitle}</SubTitle>
  </Title>
);

const Title = styled.h1`
  font-family: Georgia;
  margin-bottom: 0;
`;

const SubTitle = styled.small`
  color: ${colorProp("greyLight")};
  display: block;
  font-family: Georgia;
  font-style: italic;
  font-weight: normal;
  margin-bottom: 1rem;
`;
