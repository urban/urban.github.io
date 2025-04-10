import React from 'react';
import { typographyRecipies as clx } from './Typography.css';

const Paragraph = (props:React.HTMLAttributes<HTMLParagraphElement>) => (
  <p {...props} className={clx({ variant: 'p' })} />
);

const H4 = (props:React.HTMLAttributes<HTMLParagraphElement>) => (
  <h4 {...props} className={clx({ variant: 'h4' })} />
);

const H6 = (props:React.HTMLAttributes<HTMLParagraphElement>) => (
  <h4 {...props} className={clx({ variant: 'h6' })} />
);

export { Paragraph, H4, H6 };
