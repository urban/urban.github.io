import Link from "gatsby-link";
import * as React from "react";
import styled from "styled-components";

import { colorProp } from "../styles/themes";

interface Props {
  date: string;
  excerpt: string;
  slug: string;
  title: string;
}

export default ({ date, excerpt, slug, title }: Props) => (
  <Listing>
    <Title>
      <Link style={{ boxShadow: "none" }} to={slug}>
        {title}
      </Link>
    </Title>
    <PublishDate>{date}</PublishDate>
    <p dangerouslySetInnerHTML={{ __html: excerpt }} />
  </Listing>
);

const Listing = styled.div`
  border-bottom: 1px solid ${colorProp("greyLight")};

  :last-child {
    border-bottom-color: transparent;
  }
`;

const Title = styled.h3`
  margin-bottom: 0;
`;

const PublishDate = styled.small`
  color: ${colorProp("greyLight")};
  display: block;
  font-style: italic;
  margin-bottom: 1rem;
`;
