export const mediaSizes = {
  "desktop-screen": 1440,
  "mobile-screen": 690,
  "tablet-screen": 995
};

export default {
  /* smartphones, portrait iPhone, portrait 480x320 phones (Android) */
  "x-small": "(min-width:320px)",
  /* smartphones, Android phones, landscape iPhone */
  small: "(min-width:480px)",
  /* portrait tablets, portrait iPad, e-readers (Nook/Kindle), landscape 800x480 phones (Android) */
  medium: "(min-width:600px)",
  /* tablet, landscape iPad, lo-res laptops ands desktops */
  large: "(min-width:801px)",
  /* big landscape tablets, laptops, and desktops */
  "x-large": "(min-width:1025px)",
  /* hi-res laptops and desktops */
  "xx-large": "(min-width:1281px)"
};

export const screen = "only screen";
export const mobile = `only screen and (max-width:${
  mediaSizes["mobile-screen"]
}px)`;
export const tablet = `only screen and (min-width:${
  mediaSizes["mobile-screen"]
}px) and (max-width: ${mediaSizes["tablet-screen"]}px)`;
export const desktop = `only screen and (min-width:${
  mediaSizes["tablet-screen"]
}px)`;
export const landscape = "only screen and (orientation: landscape)";
export const portrait = "only screen and (orientation: portrait)";
