import react from "@astrojs/react"
import tailwind from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

export default defineConfig({
  integrations: [react()],
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  vite: {
    plugins: [tailwind()],
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  },
})
