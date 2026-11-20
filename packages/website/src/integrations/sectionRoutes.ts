import type { AstroIntegration } from "astro"
import { getSectionVisibility } from "../lib/sections"

export const sectionRoutes = (): AstroIntegration => ({
  name: "section-routes",
  hooks: {
    "astro:config:setup": ({ command, injectRoute }) => {
      const sections = getSectionVisibility(command === "dev")
      if (sections.now) {
        injectRoute({
          pattern: "/now",
          entrypoint: new URL("../sections/now.astro", import.meta.url),
        })
      }
      if (sections.garden) {
        injectRoute({
          pattern: "/garden",
          entrypoint: new URL("../sections/garden/index.astro", import.meta.url),
        })
        injectRoute({
          pattern: "/garden/[slug]",
          entrypoint: new URL("../sections/garden/[slug].astro", import.meta.url),
        })
      }
    },
  },
})
