import { style } from "@vanilla-extract/css";

const container  = style({
  alignItems: 'baseline',
  display: 'flex',
  height: 'calc(6 * 1rem)',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginRight: 'auto',
  marginLeft: 'auto',
  maxWidth: 'calc(960px - (1.25rem * 2))',
  padding: '1rem',
  width: '100%'
});

const logo = style({
  alignItems: 'baseline',
  borderBottom: 'none',
  display: 'flex',
});

const title = style({
  display: 'inline-block',
  fontSize: '1.2rem',
  fontWeight: 500,
  margin: '0 2rem 0 0',
  whiteSpace: 'nowrap'
});

const subTitle = style({
  /* color: ${colorProp("grey")}; */
  display: 'none',
  fontSize: '1.2rem',
  fontWeight: 300,
  margin: 0,
  whiteSpace: 'nowrap'
});

const nav = style({
  alignContent: 'center',
  alignItems: 'baseline',
  display: 'flex',
  justifyContent: 'space-between',
});

const navLink = style({

});

const link = style({
  marginLeft: '1rem',
  fontWeight: 300,
  textTransform: 'uppercase'
});

// const title:hover {
//   color: inherit;
// }

export { container, logo, title, subTitle, nav, navLink, link };
