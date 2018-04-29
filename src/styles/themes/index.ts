import baseTheme, { NAME as BASE } from "./base";

export type Themes = typeof BASE;

export interface Colors {
  dark: string;
  disabled: string;
  error: string;
  grey: string;
  greyLight: string;
  info: string;
  light: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
}

type ColorNames = keyof Colors;

export interface Theme {
  colors: Colors;
}

export const colorProp = (c: ColorNames) => (props: { theme: Theme }) =>
  props.theme.colors[c];

export default {
  [BASE]: baseTheme,
};
