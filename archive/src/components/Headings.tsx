import * as React from "react";
import styled from "styled-components";

import { colorProp } from "../styles/themes";

export const H4 = styled.h4`
  color: ${colorProp("grey")};
  font-weight: normal;
  margin-bottom: 2rem;
  text-transform: uppercase;
`;

export const H6 = styled.h6`
  color: ${colorProp("grey")};
  font-weight: normal;
  margin-bottom: 2rem;
  text-transform: uppercase;
`;
