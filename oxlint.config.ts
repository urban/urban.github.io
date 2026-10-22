import { recommended } from "@effect/tsgo/oxlint-presets"
import { defineConfig } from "oxlint"
import base from "./packages/oxc-config/oxlint.config.ts"

export default defineConfig({
  extends: [base, recommended],
  options: {
    typeAware: true,
  },
})
