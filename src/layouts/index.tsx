import Link from "gatsby-link";
import * as React from "react";
import styled, { ThemeProvider } from "styled-components";

import theme from "../styles/themes/base";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

require("normalize.css");
require("./styles.css");

interface Props {
  location: {
    pathname: string;
  };
  children: any;
}

export default ({ location, children }: Props) => (
  <ThemeProvider theme={theme}>
    <Page>
      <SiteHeader location={location} />
      <Main>
        {children()}
      </Main>
      <SiteFooter />
    </Page>
  </ThemeProvider>
);

const Page = styled.div`
  border-top: 5px solid rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1 0 auto;
  position: relative;
  padding: 4rem 1rem;
  margin-right: auto;
  margin-left: auto;
  max-width: calc(960px - (1.25rem * 2));
  width: 100%;
`;
