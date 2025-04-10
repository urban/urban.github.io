import { globalStyle } from '@vanilla-extract/css';

globalStyle('*', {
  boxSizing: 'border-box',
  scrollbarWidth: 'none'
})

globalStyle('html, body', {
  maxWidth: '100vw',
  overflowX: 'hidden'
});
