import { styleVariants } from "@vanilla-extract/css";
import { recipe, type RecipeVariants } from '@vanilla-extract/recipes';

const typographyVariants = styleVariants({
  p: { },
  h4: { fontWeight: 600, marginBottom: "2rem", textTransform: "uppercase" },
  h6: { fontWeight: 600, marginBottom: "2rem", textTransform: "uppercase" },

  "l-strong": { fontSize: 14, lineHeight: 1.5, fontWeight: 600 },
  "l-regular": { fontSize: 14, lineHeight: 1.5, fontWeight: 400 },

  "m-strong": { fontSize: 12, lineHeight: 1.5, fontWeight: 600 },
  "m-medium": { fontSize: 12, lineHeight: 1.5, fontWeight: 500 },
  "m-regular": { fontSize: 12, lineHeight: 1.5, fontWeight: 400 },

  "s-strong": { fontSize: 10, lineHeight: 1.5, fontWeight: 600 },
  "s-regular": { fontSize: 10, lineHeight: 1.5, fontWeight: 400 },
});

const typographyRecipies = recipe({
  base: [],
  variants: {
    variant: typographyVariants,
  },
  defaultVariants: {
    variant: 'm-regular',
  }
})

type Variants = RecipeVariants<typeof typographyRecipies>;

export type { Variants };
export { typographyRecipies, typographyVariants };
