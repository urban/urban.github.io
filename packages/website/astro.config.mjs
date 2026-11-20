import react from "@astrojs/react"
import tailwind from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { sectionRoutes } from "./src/integrations/sectionRoutes"

export default defineConfig({
  integrations: [react(), sectionRoutes()],
  site: "https://urban.github.io",
  output: "static",
  // Garden links and graph routes use extensionless URLs; accept both directory forms.
  trailingSlash: "ignore",
  build: { format: "directory" },
  vite: {
    plugins: [tailwind()],
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  },
})
