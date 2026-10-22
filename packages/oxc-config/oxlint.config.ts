import { defineConfig } from "oxlint"

export default defineConfig({
  plugins: ["typescript", "import", "oxc", "eslint", "unicorn", "node"],
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
  },
  rules: {
    // Tune native rules
    // Import rules
    "typescript/consistent-type-imports": [
      "error",
      {
        fixStyle: "inline-type-imports",
      },
    ],
    "typescript/no-import-type-side-effects": "error",
    "import/no-duplicates": "error",
    "import/no-self-import": "error",
    "import/no-empty-named-blocks": "error",
    // TypeScript cleanup
    "typescript/no-explicit-any": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-useless-empty-export": "error",
    // Effect uses _tag as its discriminant across errors and domain values.
    "eslint/no-underscore-dangle": ["error", { allow: ["_tag"] }],
    // Code quality
    "eslint/no-console": "error",
    "eslint/no-var": "error",
    "eslint/no-useless-constructor": "error",
    "unicorn/no-abusive-eslint-disable": "error",
    "eslint/no-unneeded-ternary": "error",
    "eslint/no-useless-concat": "error",
    "oxc/misrefactored-assign-op": "error",
    // Unicorn
    "unicorn/prefer-array-flat-map": "error",
    "unicorn/no-accessor-recursion": "error",
    "typescript/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
})
