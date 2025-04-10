import { style } from "@vanilla-extract/css";

const page = style({
  borderTop: '5px solid rgba(0, 0, 0, 0.8)',
  minHeight: '100vh'
});

const main = style({
  padding: '4rem 1rem',
  marginRight: 'auto',
  marginLeft: 'auto',
  maxWidth: 'calc(960px - (1.25rem * 2))',
  width: '100%'
});

export { main, page };
